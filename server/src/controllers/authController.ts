
import { Request, Response } from "express";
import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi"
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, password, role, status FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        message: "Email atau password salah"
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Akun Anda sudah tidak aktif. Hubungi admin."
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: "Email atau password salah"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum diatur");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Gagal login"
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password ||
      !["admin", "staff"].includes(role)) {
      return res.status(400).json({
        message: "Data pengguna tidak lengkap"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status`,
      [name, email, hashedPassword, role]
    );

    return res.status(201).json({
      message: "Pengguna berhasil dibuat",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Gagal membuat pengguna"
    });
  }
};
