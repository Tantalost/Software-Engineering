import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
// FIX 1: Import the configured object, don't name it "connectCloudinary"
import cloudinary from "./config/cloudinary.js"; 

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

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: Origin ${origin} is not in whitelist.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => res.send("API is working"));

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));