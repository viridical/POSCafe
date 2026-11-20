
import { Response } from "express";
import pool from "../config/database.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { createSnapTransaction, createQRIS, verifyNotification } from "../services/midtransService.js";
import crypto from "crypto";

export const createOrder = async (
  req: AuthRequest,
  res: Response
) => {
  const db = await pool.connect();
  let orderId: number | null = null;
  let committed = false;

  try {
    const {
      items,
      payment_method,
      customer_name,
      order_type,
      table_number
    } = req.body;

    if (
      !Array.isArray(items) ||
      !items.length ||
      !["cash", "snap", "qris"].includes(payment_method)
    ) {
      return res.status(400).json({
        message: "Data transaksi tidak valid"
      });
    }

    const productIds = items.map((item: any) =>
      Number(item.product_id)
    );

    if (
      productIds.some(
        (id: number) => !Number.isInteger(id) || id <= 0
      ) ||
      items.some(
        (item: any) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0
      ) ||
      new Set(productIds).size !== productIds.length
    ) {
      return res.status(400).json({
        message: "Produk atau jumlah tidak valid"
      });
    }

    await db.query("BEGIN");

    const products = await db.query(
      `SELECT id, name, price, is_available
       FROM products
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [productIds]
    );

    if (products.rows.length !== items.length) {
      throw new Error("Produk tidak ditemukan");
    }

    const orderItems = items.map((item: any) => {
      const product = products.rows.find(
        (p: any) => p.id === Number(item.product_id)
      );

      if (!product || !product.is_available) {
        throw new Error("Produk tidak tersedia");
      }

      const price = Number(product.price);
      const quantity = Number(item.quantity);

      return {
        product_id: product.id,
        product_name: product.name,
        price,
        quantity,
        subtotal: price * quantity
      };
    });

    const total = orderItems.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );

    const orderNumber =
      `POS-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = await db.query(
      `INSERT INTO orders
       (
         order_number,
         customer_name,
         order_type,
         table_number,
         total_amount,
         payment_method,
         status,
         user_id,
         payment_status,
         order_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        orderNumber,
        customer_name || "Walk-in",
        order_type || "dine_in",
        table_number || null,
        total,
        payment_method,
        payment_method === "cash" ? "completed" : "pending",
        Number(req.user!.id),
        payment_method === "cash" ? "paid" : "pending",
        payment_method === "cash" ? "completed" : "pending"
      ]
    );

    orderId = order.rows[0].id;

    for (const item of orderItems) {
      await db.query(
        `INSERT INTO order_items
         (
           order_id,
           product_id,
           product_name,
           unit_price,
           quantity,
           subtotal
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal
        ]
      );
    }

    if (payment_method === "cash") {
      await db.query(
        `INSERT INTO payments
         (
           order_id,
           order_number,
           gross_amount,
           payment_type,
           transaction_status
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          orderNumber,
          total,
          "cash",
          "settlement"
        ]
      );

      await db.query("COMMIT");
      committed = true;

      return res.status(201).json({
        message: "Transaksi tunai berhasil",
        order: order.rows[0]
      });
    }

    await db.query("COMMIT");
    committed = true;

    try {
      const payment =
        payment_method === "snap"
          ? await createSnapTransaction(
              orderNumber,
              total,
              orderItems
            )
          : await createQRIS(
              orderNumber,
              total,
              orderItems
            );

      await pool.query(
        `INSERT INTO payments
         (
           order_id,
           order_number,
           gross_amount,
           payment_type,
           transaction_status,
           transaction_id
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          orderNumber,
          total,
          payment_method,
          "pending",
          payment.transaction_id || null
        ]
      );

      return res.status(201).json({
        message: "Pembayaran berhasil dibuat",
        order_number: orderNumber,
        payment_method,
        snap_token: payment.token || null,
        redirect_url: payment.redirect_url || null,
        qr_string: payment.qr_string || null,
        actions: payment.actions || [],
        total
      });
    } catch (error) {
      await pool.query(
        `UPDATE orders
         SET payment_status = 'failed',
             order_status = 'cancelled',
             status = 'cancelled'
         WHERE id = $1`,
        [orderId]
      );

      throw error;
    }
  } catch (error: any) {
    if (!committed) {
      await db.query("ROLLBACK").catch(() => {});
    }

    return res.status(400).json({
      message: error.message || "Gagal membuat transaksi"
    });
  } finally {
    db.release();
  }
};

export const midtransNotification = async (
  req: any,
  res: Response
) => {
  const db = await pool.connect();

  try {
    const data = req.body;

    if (!verifyNotification(data)) {
      return res.status(403).json({
        message: "Signature tidak valid"
      });
    }

    await db.query("BEGIN");

    const result = await db.query(
      `SELECT id, total_amount
       FROM orders
       WHERE order_number = $1
       FOR UPDATE`,
      [data.order_id]
    );

    if (!result.rows.length) {
      throw new Error("Transaksi tidak ditemukan");
    }

    if (
      Number(result.rows[0].total_amount) !==
      Number(data.gross_amount)
    ) {
      throw new Error("Nominal transaksi tidak cocok");
    }

    const paymentStatus = data.transaction_status;

    let status = "pending";

    if (
      paymentStatus === "settlement" ||
      (
        paymentStatus === "capture" &&
        data.fraud_status === "accept"
      )
    ) {
      status = "paid";
    } else if (
      ["expire", "cancel", "deny"].includes(paymentStatus)
    ) {
      status = "failed";
    }

    await db.query(
      `UPDATE payments
       SET transaction_id = $1,
           transaction_status = $2
       WHERE order_number = $3`,
      [
        data.transaction_id || null,
        paymentStatus,
        data.order_id
      ]
    );

    await db.query(
      `UPDATE orders
       SET payment_status = $1,
           order_status = CASE
             WHEN $1 = 'paid' THEN 'completed'
             WHEN $1 = 'failed' THEN 'cancelled'
             ELSE order_status
           END,
           status = CASE
             WHEN $1 = 'paid' THEN 'completed'
             WHEN $1 = 'failed' THEN 'cancelled'
             ELSE status
           END
       WHERE order_number = $2`,
      [status, data.order_id]
    );

    await db.query("COMMIT");

    return res.json({
      message: "Notifikasi berhasil diproses"
    });
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});

    return res.status(500).json({
      message: "Gagal memproses notifikasi"
    });
  } finally {
    db.release();
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name AS cashier
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE $1::int IS NULL OR o.user_id = $1
       ORDER BY o.created_at DESC`,
      [
        req.user!.role === "admin"
          ? null
          : Number(req.user!.id)
      ]
    );

    return res.json(result.rows);
  } catch {
    return res.status(500).json({
      message: "Gagal mengambil transaksi"
    });
  }
};

export const getOrderDetail = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name AS cashier
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.order_number = $1
       AND ($2::int IS NULL OR o.user_id = $2)`,
      [
        req.params.orderNumber,
        req.user!.role === "admin"
          ? null
          : Number(req.user!.id)
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Transaksi tidak ditemukan"
      });
    }

    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [result.rows[0].id]
    );

    const payment = await pool.query(
      `SELECT order_number, payment_type, gross_amount,
              transaction_status, transaction_id
       FROM payments
       WHERE order_id = $1`,
      [result.rows[0].id]
    );

    return res.json({
      order: result.rows[0],
      items: items.rows,
      payment: payment.rows[0] || null
    });
  } catch {
    return res.status(500).json({
      message: "Gagal mengambil detail transaksi"
    });
  }
};
