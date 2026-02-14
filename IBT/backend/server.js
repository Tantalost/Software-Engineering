import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

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

connectDB();

const app = express();

let bucket;
mongoose.connection.once('open', () => {
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads' 
  });
  console.log("GridFS Bucket initialized");
});

export { bucket };

app.use(cors({
    origin: "*", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => res.send("IBT Management System API is working"));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));