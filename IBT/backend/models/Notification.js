import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    source: { type: String, default: "System" }, 
    date: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now } 
});

export default mongoose.model("Notification", notificationSchema);