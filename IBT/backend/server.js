import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

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


connectDB();
connectCloudinary();

const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => res.send("API is working"));

app.use("/api/bustrips", busTripRoutes);
app.use("/api/terminal-fees", terminalFeeRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/deletion-requests", deletionRequestRoutes);
app.use("/api/archives", archiveRoutes);
app.use("/api/waitlist", waitlistRoutes); 
app.use("/api/tenants", tenantRoutes);
app.use("/api/lostfound", lostfoundRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));