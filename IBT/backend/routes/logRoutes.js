import express from "express";
import { getLogs, createLog, clearLogs } from "../controllers/logController.js";

const router = express.Router();

router.get("/", getLogs);
router.post("/", createLog);
router.delete("/", clearLogs);

export default router;