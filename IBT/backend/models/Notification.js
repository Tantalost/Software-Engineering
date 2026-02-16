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
  source: { 
    type: String, 
    default: "System" 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  // Unified role targeting: 
  // "superadmin" = Web Admin, "tenant" = Mobile App, "all" = both
  targetRole: { 
    type: String, 
    enum: ["all", "superadmin", "tenant"], 
    default: "all" 
  },
  // Allows targeting a specific mobile user if needed
  targetUserId: { 
    type: String,
    required: false
  },
  // Uses YYYY-MM-DD format as standard
  date: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0] 
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt for better sorting
});

// Defensive export to prevent OverwriteModelError
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;