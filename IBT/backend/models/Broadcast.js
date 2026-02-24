import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String, default: 'INTEGRATED BUS TERMINAL ZC' },
  attachment: {
    type: { type: String, enum: ['image', 'pdf'] },
    uri: { type: String },
    name: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('Broadcast', broadcastSchema);