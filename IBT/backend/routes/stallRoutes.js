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

const TENANT_APPLICATION_IMAGE_FIELDS = new Set([
  'permit',
  'validId',
  'clearance',
  'communityTax',
  'policeClearance',
]);

const TENANT_APPLICATION_ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const tenantApplicationImageFileFilter = (req, file, cb) => {
  if (!TENANT_APPLICATION_IMAGE_FIELDS.has(file.fieldname)) {
    cb(null, true);
    return;
  }

  const mimeType = String(file.mimetype || '').toLowerCase();
  if (TENANT_APPLICATION_ALLOWED_MIME_TYPES.has(mimeType)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PNG and JPEG files are allowed for tenant application requirements.'));
};

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
  fileFilter: tenantApplicationImageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 
  }
});

const uploadApplicationFiles = (req, res, next) => {
  const runUpload = upload.fields([
    { name: 'permit', maxCount: 1 },
    { name: 'validId', maxCount: 1 },
    { name: 'clearance', maxCount: 1 },
    { name: 'communityTax', maxCount: 1 },
    { name: 'policeClearance', maxCount: 1 },
  ]);

  runUpload(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(400).json({
      message: err.message || 'Invalid file upload for tenant application.',
    });
  });
};

router.get('/pending', getPendingStalls); 
router.get('/occupied', getOccupiedStalls);

router.get('/doc/:filename', getSecureDocument);
router.get('/my-application/:userId', verifyToken, getMyApplication);

router.post('/apply', 
  verifyToken,
  uploadApplicationFiles,
  submitApplication
);

router.post('/pay', verifyToken, upload.single('receipt'), submitPayment);
router.post('/upload-contract', verifyToken, upload.single('contract'), uploadContract);
router.post('/pay-renewal', verifyToken, upload.single('receipt'), submitRenewalPayment);
router.post('/renew-contract', verifyToken, upload.single('contract'), submitRenewalContractRequest);

export default router;