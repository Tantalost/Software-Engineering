import express from 'express';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage'; 
import path from 'path';
import dotenv from 'dotenv';

import { 
  getOccupiedStalls, 
  getPendingStalls,
  getMyApplication, 
  submitApplication, 
  submitPayment,
  uploadContract,
  getSecureDocument 
} from '../controllers/stallController.js';

dotenv.config();

const router = express.Router();

const storage = new GridFsStorage({
  url: process.env.MONGODB_URL, 
  file: (req, file) => {
    return {
      bucketName: 'uploads', 
      filename: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    };
  }
});

const upload = multer({ storage });

router.get('/pending', getPendingStalls); 

router.get('/occupied', getOccupiedStalls);
router.get('/doc/:filename', getSecureDocument);
router.get('/my-application/:userId', getMyApplication);

router.post('/apply', 
  upload.fields([
    { name: 'permit', maxCount: 1 }, 
    { name: 'validId', maxCount: 1 },
    { name: 'clearance', maxCount: 1 }
  ]), 
  submitApplication
);

router.post('/pay', upload.single('receipt'), submitPayment);
router.post('/upload-contract', upload.single('contract'), uploadContract);

export default router;