import express from 'express';
import multer from 'multer';
import upload from '../middleware/upload.js';
import { 
  createBroadcast, 
  getBroadcasts, 
  getAdminBroadcasts,
  deleteBroadcast,
  updateBroadcast    
} from '../controllers/broadcastController.js';

const router = express.Router();

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

router.get('/', getBroadcasts);

router.get('/admin', getAdminBroadcasts);
router.put('/:id', uploadMiddleware, updateBroadcast);
router.delete('/:id', deleteBroadcast);

router.post('/', uploadMiddleware, createBroadcast);

export default router;