import express from "express";
import {
  createAdmin,
  listAdmins,
  deleteAdmin,
  updateAdminPassword,
  loginAdmin,
  verifyAdminOtp,
} from "../controllers/adminController.js";

const router = express.Router();

// Manage admins
router.get("/", listAdmins);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);
router.patch("/:id/password", updateAdminPassword);

// Auth & OTP
router.post("/login", loginAdmin);
router.post("/verify-otp", verifyAdminOtp);

export default router;

