import express from "express";
import { 
  getTerminalFees, 
  createTerminalFee, 
  updateTerminalFee, 
  deleteTerminalFee,
  archiveTerminalFee,
  restoreTerminalFee,
  getArchivedTerminalFees,   
  updateTerminalFeePrices,
  getNextTicketNumber,
  submitTerminalFeesForShift,
} from "../controllers/terminalFeeController.js";

const router = express.Router();

router.get("/", getTerminalFees);
router.get("/archived", getArchivedTerminalFees); 
router.get("/next-ticket", getNextTicketNumber);
router.post("/", createTerminalFee);
router.put("/submit-shift", submitTerminalFeesForShift);
router.put("/update-prices", updateTerminalFeePrices);
router.put("/:id", updateTerminalFee);



router.patch("/:id/archive", archiveTerminalFee);
router.patch("/:id/restore", restoreTerminalFee);
router.delete("/:id", deleteTerminalFee);

export default router;