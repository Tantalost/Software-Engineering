import express from "express";
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage'; // New import
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant
} from "../controllers/tenantController.js";

const router = express.Router();

// ✅ NEW: GridFS Storage Engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: 'uploads', // Must match bucketName in server.js
      filename: `${Date.now()}-${file.originalname}`
    };
  }
});

const upload = multer({ storage });

router.get('/', getTenants);

// Routes remain the same, but now 'upload' uses GridFS
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