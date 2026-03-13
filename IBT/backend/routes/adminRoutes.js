import express from "express";
import {
  createAdmin,
  listAdmins,
  deleteAdmin,
  updateAdmin,
  sendOtp,
  loginAdmin,
  verifyAdminOtp,
  requestPasswordReset, // New
  verifyResetOtp,       // New
  resetPassword,         // New
  generateNewRecoveryCodes,
  getRecoveryCodeCount
} from "../controllers/adminController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Manage admins
router.get("/", listAdmins);
router.post("/", createAdmin);
router.get('/recovery-codes/count', verifyToken, getRecoveryCodeCount);
router.delete("/:id", deleteAdmin);

// Auth & OTP
router.patch("/:id", updateAdmin);
router.post("/auth/send-otp", sendOtp);

router.post("/login", loginAdmin);
router.post("/verify-otp", verifyAdminOtp);

// NEW: Forgot Password Routes
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post('/generate-recovery-codes', verifyToken, generateNewRecoveryCodes);


export default router;