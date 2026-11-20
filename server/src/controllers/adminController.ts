
import { Request, Response } from "express";
import pool from "../config/database.js";
import bcrypt from "bcryptjs";

// DASHBOARD
export const dashboard = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
        ) AS total_transactions,

        COALESCE(SUM(total_amount) FILTER (
          WHERE payment_status = 'paid'
        ), 0) AS total_revenue,

        COUNT(*) FILTER (
          WHERE payment_status = 'pending'
        ) AS pending_transactions,

        COUNT(*) FILTER (
          WHERE created_at::date = CURRENT_DATE
          AND payment_status = 'paid'
        ) AS today_transactions,

        COALESCE(SUM(total_amount) FILTER (
          WHERE created_at::date = CURRENT_DATE
          AND payment_status = 'paid'
        ), 0) AS today_revenue

      FROM orders
    `);

    const products = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    const staff = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'staff'"
    );

    const recent = await pool.query(`
      SELECT
        o.order_number,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        u.name AS cashier
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      status: "success",
      statistics: result.rows[0],
      total_products: Number(products.rows[0].count),
      total_staff: Number(staff.rows[0].count),
      recent_transactions: recent.rows
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Gagal mengambil dashboard"
    });
  }
};


// GET PRODUCTS
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        p.created_at,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `);

    res.json({
      status: "success",
      data: result.rows
    });

  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      message: "Gagal mengambil produk"
    });
  }
};


// CREATE PRODUCT
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      is_available
    } = req.body;

    // Mengambil URL foto dari Multer
    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // Validasi
    if (
      !category_id ||
      !name?.trim() ||
      price === undefined ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Kategori, nama, dan harga wajib diisi"
      });
    }

    if (Number(price) < 0 || !Number.isFinite(Number(price))) {
      return res.status(400).json({
        message: "Harga tidak valid"
      });
    }

    const result = await pool.query(
      `INSERT INTO products
       (category_id, name, description, price, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        category_id,
        name.trim(),
        description || null,
        Number(price),
        image_url,
        is_available === undefined
          ? true
          : is_available === "true"
      ]
    );

    res.status(201).json({
      status: "success",
      message: "Produk berhasil ditambahkan",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      message: "Gagal menambahkan produk"
    });
  }
};


// UPDATE PRODUCT
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      is_available
    } = req.body;

    // Foto baru jika diupload
    // Jika tidak ada foto baru, gunakan foto lama
    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    if (price !== undefined && price !== "" &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({
        message: "Harga tidak valid"
      });
    }

    const result = await pool.query(
      `UPDATE products SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        is_available = COALESCE($6, is_available)
       WHERE id = $7
       RETURNING *`,
      [
        category_id || null,
        name?.trim() || null,
        description ?? null,
        price !== undefined && price !== ""
          ? Number(price)
          : null,
        image_url,
        is_available !== undefined
          ? is_available === "true"
          : null,
        req.params.id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan"
      });
    }

    res.json({
      status: "success",
      message: "Produk berhasil diperbarui",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      message: "Gagal memperbarui produk"
    });
  }
};


// DELETE PRODUCT
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan"
      });
    }

    res.json({
      status: "success",
      message: "Produk berhasil dihapus"
    });

  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      message: "Gagal menghapus produk"
    });
  }
};


// GET STAFF
export const getStaff = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY id DESC
    `);

    res.json({
      status: "success",
      data: result.rows
    });

  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      message: "Gagal mengambil data pengguna"
    });
  }
};


// UPDATE STAFF
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;

    if (password && password.length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter"
      });
    }

    const hashed = password
      ? await bcrypt.hash(password, 12)
      : null;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        password = COALESCE($2, password)
       WHERE id = $3
       RETURNING id, name, email, role, created_at`,
      [name || null, hashed, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Pengguna tidak ditemukan"
      });
    }

    res.json({
      status: "success",
      message: "Data pengguna berhasil diperbarui",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      message: "Gagal memperbarui pengguna"
    });
  }
};


// REPORTS
export const reports = async (req: Request, res: Response) => {
  try {
    const startDate =
      typeof req.query.start_date === "string"
        ? req.query.start_date
        : new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString().slice(0, 10);

    const endDate =
      typeof req.query.end_date === "string"
        ? req.query.end_date
        : new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `SELECT
        COUNT(*) AS total_transactions,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(AVG(total_amount), 0) AS average_transaction
       FROM orders
       WHERE payment_status = 'paid'
       AND created_at >= $1::date
       AND created_at < ($2::date + INTERVAL '1 day')`,
      [startDate, endDate]
    );

    const daily = await pool.query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS transactions,
        SUM(total_amount) AS revenue
       FROM orders
       WHERE payment_status = 'paid'
       AND created_at >= $1::date
       AND created_at < ($2::date + INTERVAL '1 day')
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [startDate, endDate]
    );

    res.json({
      status: "success",
      summary: result.rows[0],
      daily: daily.rows
    });

  } catch (error) {
    console.error("Reports error:", error);

    res.status(500).json({
      message: "Gagal mengambil laporan"
    });
  }
};
