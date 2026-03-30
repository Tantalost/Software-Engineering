import express from "express";
import { getDispatchBoardToday } from "../controllers/mobileBusBoardController.js";

const router = express.Router();
router.get("/today", getDispatchBoardToday);

export default router;
