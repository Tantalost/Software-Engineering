import express from "express";
import { 
  getTerminalFees, 
  createTerminalFee, 
  updateTerminalFee, 
  deleteTerminalFee 
} from "../controllers/terminalFeeController.js";

const router = express.Router();

router.get("/", getTerminalFees);
router.post("/", createTerminalFee);
router.put("/:id", updateTerminalFee);
router.delete("/:id", deleteTerminalFee);

export default router;