import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String, default: 'INTEGRATED BUS TERMINAL ZC' },
 
  attachments: [{
    type: { type: String, enum: ['image', 'video'] },
    uri: { type: String },
    name: { type: String }
  }],
 
  scheduledFor: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Broadcast', broadcastSchema);