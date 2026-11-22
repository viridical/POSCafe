
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token tidak ditemukan"
    });
  }

  let decoded: { id: number };

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number; role: string };
  } catch {
    return res.status(401).json({
      message: "Token tidak valid"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, role, status
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Akun tidak ditemukan"
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Akun Anda sudah tidak aktif"
      });
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();

  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Gagal memverifikasi akun"
    });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Akses khusus admin"
    });
  }

  next();
};
