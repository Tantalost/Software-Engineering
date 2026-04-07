import express from "express";
import {
  createCollector,
  deleteCollector,
  listCollectors,
  updateCollector,
} from "../controllers/collectorController.js";

const router = express.Router();

router.get("/", listCollectors);
router.post("/", createCollector);
router.patch("/:id", updateCollector);
router.delete("/:id", deleteCollector);

export default router;
