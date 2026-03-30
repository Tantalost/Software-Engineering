import express from "express";
import { getPredefinedScheduleToday } from "../controllers/mobileBusBoardController.js";

const router = express.Router();
router.get("/today", getPredefinedScheduleToday);

export default router;
