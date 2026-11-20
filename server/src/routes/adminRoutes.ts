import { Router } from "express";
import { dashboard, getProducts, createProduct, updateProduct, deleteProduct, getStaff, updateStaff, reports } from "../controllers/adminController.js";
import { authenticate, adminOnly } from "../middleware/authMiddleware.js";
import { createUser } from "../controllers/authController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(authenticate, adminOnly);

router.get("/dashboard", dashboard);

router.get("/products", getProducts);
router.post("/products", upload.single("image"), createProduct);
router.put("/products/:id", upload.single("image"), updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/staff", getStaff);
router.post("/staff", createUser);
router.put("/staff/:id", updateStaff);

router.get("/reports", reports);

export default router;