import { Router } from "express";
import { midtransNotification } from "../controllers/orderController.js";

const router = Router();

router.post("/notification", midtransNotification);

export default router;