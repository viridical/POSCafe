import { Router } from "express";
import { login, createUser } from "../controllers/authController.js";
import { authenticate, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", authenticate, adminOnly, createUser);

export default router;