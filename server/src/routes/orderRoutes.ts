import { Router } from "express";
import { createOrder, getOrders, getOrderDetail } from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:orderNumber", getOrderDetail);

export default router;