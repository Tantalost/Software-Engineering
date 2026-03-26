import express from "express";
import upload from "../middleware/upload.js";
import { 
    register, 
    sendRegistrationOtp,
    login, 
    requestPasswordReset, 
    resetPassword,
    updateProfile,
    getAvatar,

    changePassword,
    deactivateAccount,
    reactivateRequest,
    reactivateConfirm
} from "../controllers/authController.js";

import { requestEmailChangeOtp, verifyAndChangeEmail } from "../controllers/authController.js";

const router = express.Router();


router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password-request", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.put("/update-profile", upload.single('avatar'), updateProfile);
router.get("/avatar/:filename", getAvatar);


router.post("/change-password", changePassword);
router.post("/deactivate", deactivateAccount);
router.post("/reactivate-request", reactivateRequest);
router.post("/reactivate-confirm", reactivateConfirm);

router.post("/request-email-change", requestEmailChangeOtp);
router.post("/verify-email-change", verifyAndChangeEmail);

export default router;