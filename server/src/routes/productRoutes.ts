import { Router } from "express";
import db from "../config/database.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        products.id,
        products.category_id,
        products.name,
        products.description,
        products.price,
        products.image_url,
        products.is_available,
        categories.name AS category_name
      FROM products
      LEFT JOIN categories
        ON products.category_id = categories.id
      ORDER BY products.id ASC
    `);

    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Gagal mengambil produk:", error);

    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data produk",
    });
  }
});

export default router;