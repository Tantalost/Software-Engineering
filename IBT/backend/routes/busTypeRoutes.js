import express from "express";
import {
  getBusTypes,
  createBusType,
  updateBusType,
} from "../controllers/busTypeController.js";
import { requireSuperAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getBusTypes);
router.post("/", verifyToken, requireSuperAdmin, createBusType);
router.put("/:id", verifyToken, requireSuperAdmin, updateBusType);

export default router;
