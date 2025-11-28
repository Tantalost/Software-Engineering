import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

import busTripRoutes from "./routes/busTripRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js"; 
import tenantRoutes from "./routes/tenantRoutes.js";

connectDB();
connectCloudinary();

const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => res.send("API is working"));

app.use("/api/bustrips", busTripRoutes);
app.use("/api/waitlist", waitlistRoutes); 
app.use("/api/tenants", tenantRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));