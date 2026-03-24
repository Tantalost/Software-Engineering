import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String, default: 'INTEGRATED BUS TERMINAL ZC' },
  targetGroup: { 
    type: String, 
    enum: ['All', 'Permanent Tenants', 'Night Market'],
    default: 'All' 
  },
  
  // Due date must be within the first 5 days of the month for tenant announcements
  dueDate: { 
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const day = new Date(value).getDate();
        return day >= 1 && day <= 5; // Must be within 1st to 5th day
      },
      message: 'Due date must be within the first 5 days of the month'
    }
  },

  attachments: [{
    type: { type: String, enum: ['image', 'video'] },
    uri: { type: String },
    name: { type: String }
  }],
 
  scheduledFor: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Broadcast', broadcastSchema);