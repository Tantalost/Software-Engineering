import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  
  message: { 
    type: String, 
    required: true 
  },
  
  // Who sent it? (System, Admin, etc.)
  source: { 
    type: String, 
    default: "System" 
  },
  
  // Has it been clicked?
  read: { 
    type: Boolean, 
    default: false 
  },
  
  // CRITICAL FIELD FOR YOUR FLOW:
  // "superadmin" = Only visible in Web Admin (e.g., New Application, Receipt Uploaded)
  // "tenant"     = Only visible in Mobile App (e.g., Welcome, Rules)
  // "all"        = Visible to everyone
  targetRole: { 
    type: String, 
    enum: ["all", "superadmin", "tenant"], 
    default: "all" 
  },

  // Optional: If you want to notify a specific user (by deviceId)
  targetUserId: { 
    type: String,
    required: false
  },

  // Stores date string (matches your controller logic: YYYY-MM-DD)
  date: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0] 
  }

}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.model("Notification", notificationSchema);