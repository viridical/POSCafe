import db from "./config/database.js";
import bcrypt from "bcryptjs";

const createAdmin = async () => {
  try {
    const name = "Admin";
    const email = "admin@poscafe.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [name, email, hashedPassword, "admin"]
    );

    console.log("Admin berhasil dibuat");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Gagal membuat admin:", error);
  } finally {
    await db.end?.();
  }
};

createAdmin();