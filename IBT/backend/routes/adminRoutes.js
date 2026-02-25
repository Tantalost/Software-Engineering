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
  resetPassword         // New
} from "../controllers/adminController.js";

const router = express.Router();

// Manage admins
router.get("/", listAdmins);
router.post("/", createAdmin);
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

export default router;