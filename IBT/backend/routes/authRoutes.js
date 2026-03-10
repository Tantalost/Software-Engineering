import express from "express";
import upload from "../middleware/upload.js";
import { 
    register, 
    login, 
    requestPasswordReset, 
    resetPassword,
    updateProfile,
    getAvatar 
} from "../controllers/authController.js";

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password-request", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.put("/update-profile", upload.single('avatar'), updateProfile);

router.get("/avatar/:filename", getAvatar);

export default router;