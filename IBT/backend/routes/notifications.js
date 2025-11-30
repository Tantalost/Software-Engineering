import express from "express";
import { 
    getNotifications, 
    createNotification, 
    markAsRead, 
    deleteNotification 
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.post("/", createNotification);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;