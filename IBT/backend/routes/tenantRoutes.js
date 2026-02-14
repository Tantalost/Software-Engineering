import express from "express";
import multer from 'multer';
// FIX 3: Import the CONFIGURED cloudinary from your config folder
import cloudinary from '../config/cloudinary.js'; 
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant
} from "../controllers/tenantController.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tenant_documents',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

const upload = multer({ storage: storage });

router.get('/', getTenants);

router.post('/', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 }
  ]), 
  createTenant
);

router.delete('/:id', deleteTenant);

router.put('/:id', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 }
  ]), 
  updateTenant
);

export default router;