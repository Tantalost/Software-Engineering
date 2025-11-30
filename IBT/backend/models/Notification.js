import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  source: String,
  read: { type: Boolean, default: false },
  date: { type: String, default: new Date().toLocaleString() },
  
  // 👇 YOU MUST ADD THIS FIELD 👇
  targetRole: { type: String, default: "all" } 
});

export default mongoose.model("Notification", notificationSchema);