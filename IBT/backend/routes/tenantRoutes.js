import express from "express";
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import "dotenv/config"; 
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant
} from "../controllers/tenantController.js";

const router = express.Router();

// --- 1. GridFS Storage Configuration ---
const storage = new GridFsStorage({
  // ✅ UPDATED: Changed from MONGO_URI to MONGODB_URL to match your Dashboard
  url: process.env.MONGODB_URL, 
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads' 
      };
      resolve(fileInfo);
    });
  }
});

// --- 2. Connection Debugging ---
storage.on('connection', () => {
  console.log("Multer-GridFS: Successfully connected using MONGODB_URL");
});

storage.on('connectionError', (err) => {
  console.error("Multer-GridFS: Connection failed. Check if MONGODB_URL is correct in Render.");
});

// --- 3. Multer Initialization ---
const upload = multer({ storage });

// --- 4. Routes ---
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