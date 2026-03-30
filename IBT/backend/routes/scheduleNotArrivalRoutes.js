import express from "express";
import {
  upsertScheduleNotArrival,
  listScheduleNotArrivalsByDate,
  deleteScheduleNotArrival,
} from "../controllers/scheduleNotArrivalController.js";

const router = express.Router();

router.post("/", upsertScheduleNotArrival);
router.get("/", listScheduleNotArrivalsByDate);
router.delete("/", deleteScheduleNotArrival);

export default router;
