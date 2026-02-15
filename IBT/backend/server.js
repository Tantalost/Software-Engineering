import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

// --- EXISTING WEB ROUTES ---
import busTripRoutes from "./routes/busTripRoutes.js";
import terminalFeeRoutes from "./routes/terminalFeeRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import deletionRequestRoutes from "./routes/deletionRequestRoutes.js";
import archiveRoutes from "./routes/archiveRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js"; 
import tenantRoutes from "./routes/tenantRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import lostfoundRoutes from "./routes/lostfoundRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notifications from "./routes/notifications.js"; 
import companyRoutes from "./routes/companyRoutes.js"; 
import adminRoutes from "./routes/adminRoutes.js";

// --- NEW MOBILE ROUTES ---
// Ensure stallRoutes.js has been moved to backend/routes/
import stallRoutes from "./routes/stallRoutes.js"; 

connectDB();

const app = express();

// Initialize GridFS Bucket
let bucket;
mongoose.connection.once('open', () => {
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads' 
  });
  console.log("GridFS Bucket initialized");
});

// Export bucket so controllers (like stallController) can use it
export { bucket };

// Middlewares
app.use(cors({
    origin: "*", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Standard Health Check
app.get('/', (req, res) => res.send("IBT Unified Management System API is working"));

// Mobile Connection Test Endpoint
// This helps verify the mobile app can "see" the backend
app.get('/api/test-connection', (req, res) => {
  res.json({ 
    status: "online", 
    message: "IBT Unified Backend is reachable", 
    dbConnected: mongoose.connection.readyState === 1 
  });
});

// --- ROUTE MOUNTING ---

// Web-focused routes
app.use("/api/bustrips", busTripRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/terminal-fees", terminalFeeRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/deletion-requests", deletionRequestRoutes);
app.use("/api/archives", archiveRoutes);
app.use("/api/waitlist", waitlistRoutes); 
app.use("/api/tenants", tenantRoutes);
app.use("/api/lostfound", lostfoundRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notifications);
app.use("/api/admins", adminRoutes);

// Mobile-focused routes
// Final URL: ...onrender.com/api/stalls/occupied
app.use("/api/stalls", stallRoutes); 

// File retrieval endpoint for GridFS
app.get('/api/files/:filename', async (req, res) => {
  try {
    const file = await bucket.find({ filename: req.params.filename }).toArray();
    
    if (!file || file.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.set('Content-Type', file[0].contentType);
    
    const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
    
    downloadStream.on('error', () => {
      res.status(404).json({ message: "Error streaming file" });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Server error retrieving file", error: error.message });
  }
});

// Port Configuration for Render
// Render automatically provides a PORT environment variable
const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => console.log(`Unified Server running on port ${PORT}`));