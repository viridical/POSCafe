import { Router } from "express";
import db from "../config/database.js";
import { authenticate, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM categories ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({
      message: "Gagal mengambil kategori"
    });
  }
});

router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Nama kategori wajib diisi"
      });
    }

    const result = await db.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({
      message: "Gagal menambahkan kategori"
    });
  }
});

router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    const result = await db.query(
      "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
      [name?.trim(), req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan"
      });
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      message: "Gagal memperbarui kategori"
    });
  }
});

router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM categories WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan"
      });
    }

    res.json({
      message: "Kategori berhasil dihapus"
    });
  } catch {
    res.status(500).json({
      message: "Gagal menghapus kategori"
    });
  }
});

export default router;