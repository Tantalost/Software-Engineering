import express from 'express';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage'; 
import path from 'path';
import dotenv from 'dotenv';

import { verifyToken } from '../middleware/authMiddleware.js';

import { 
  getOccupiedStalls, 
  getPendingStalls,
  getMyApplication, 
  submitApplication, 
  submitPayment,
  uploadContract,
  getSecureDocument,
  submitRenewalPayment,
  submitRenewalContractRequest,
} from '../controllers/stallController.js';

dotenv.config();

const router = express.Router();

const mongoURL = process.env.MONGODB_URL;

const storage = new GridFsStorage({
  url: mongoURL, 
  file: (req, file) => {
    return {
      bucketName: 'uploads', 
      filename: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    };
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 
  }
});

router.get('/pending', getPendingStalls); 
router.get('/occupied', getOccupiedStalls);

router.get('/doc/:filename', getSecureDocument);
router.get('/my-application/:userId', verifyToken, getMyApplication);

router.post('/apply', 
  verifyToken,
  upload.fields([
    { name: 'permit', maxCount: 1 }, 
    { name: 'validId', maxCount: 1 },
    { name: 'clearance', maxCount: 1 },
    { name: 'communityTax', maxCount: 1 },
    { name: 'policeClearance', maxCount: 1 }
  ]), 
  submitApplication
);

router.post('/pay', verifyToken, upload.single('receipt'), submitPayment);
router.post('/upload-contract', verifyToken, upload.single('contract'), uploadContract);
router.post('/pay-renewal', verifyToken, upload.single('receipt'), submitRenewalPayment);
router.post('/renew-contract', verifyToken, upload.single('contract'), submitRenewalContractRequest);

export default router;