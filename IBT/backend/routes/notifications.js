import express from "express";
import multer from 'multer';
import upload from '../middleware/upload.js';
import { 
    getNotifications, 
    createNotification, 
    markAsRead, 
    deleteNotification,
    broadcastNotification 
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.post("/", createNotification);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

const uploadMiddleware = (req, res, next) => {
  const uploadFiles = upload.array('files', 5);
  uploadFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Max 50MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/broadcast', uploadMiddleware, broadcastNotification);

export default router;