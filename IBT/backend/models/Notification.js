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
  targetRole: { 
    type: String, 
    enum: ["all", "superadmin", "tenant"], 
    default: "all" 
  },
 
  targetUserId: { 
    type: String,
    required: false
  },

  referenceId: { type: String, required: false },
  
  date: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0] 
  },
 
  dueDate: {
    type: Date,
    required: false
  }
}, { 
  timestamps: true 
});


const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;