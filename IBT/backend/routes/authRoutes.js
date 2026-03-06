import express from "express";
import { 
    register, 
    login, 
    requestPasswordReset, 
    resetPassword 
} from "../controllers/authController.js";

const router = express.Router();

router.post("/forgot-password-request", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/register", register);
router.post("/login", login);

export default router;