import express from "express";
import { 
  getTerminalFees, 
  createTerminalFee, 
  updateTerminalFee, 
  deleteTerminalFee,
  archiveTerminalFee,
  restoreTerminalFee,
  getArchivedTerminalFees
} from "../controllers/terminalFeeController.js";

const router = express.Router();

router.get("/", getTerminalFees);
router.get("/archived", getArchivedTerminalFees); // New: Fetch archived
router.post("/", createTerminalFee);
router.put("/:id", updateTerminalFee);

// New: Soft Delete Routes
router.patch("/:id/archive", archiveTerminalFee);
router.patch("/:id/restore", restoreTerminalFee);

// Hard Delete Route
router.delete("/:id", deleteTerminalFee);

export default router;