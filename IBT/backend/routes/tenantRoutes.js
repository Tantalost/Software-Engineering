import express from "express";
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import "dotenv/config"; // CRITICAL: Loads environment variables before storage initialization
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant
} from "../controllers/tenantController.js";

const router = express.Router();

// --- 1. GridFS Storage Configuration ---
// This engine tells Multer to send files directly to your MongoDB
const storage = new GridFsStorage({
  url: process.env.MONGO_URI, // Ensure this matches your Render Dashboard Key
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    // This function runs for every file uploaded
    return {
      bucketName: 'uploads', // Must match the bucket name in server.js
      filename: `${Date.now()}-${file.originalname}` // Unique filename for retrieval
    };
  }
});

// --- 2. Connection Debugging ---
// These logs will appear in your Render console to confirm connection health
storage.on('connection', () => {
  console.log("Multer-GridFS: Successfully connected to MongoDB for uploads");
});

storage.on('connectionError', (err) => {
  console.error("Multer-GridFS: Failed to connect to MongoDB:", err.message);
});

// --- 3. Multer Initialization ---
const upload = multer({ storage });

// --- 4. Routes ---
router.get('/', getTenants);

// POST: Create a new tenant with up to 3 document uploads
router.post('/', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 }
  ]), 
  createTenant
);

router.delete('/:id', deleteTenant);

// PUT: Update an existing tenant and their documents
router.put('/:id', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 }
  ]), 
  updateTenant
);

export default router;