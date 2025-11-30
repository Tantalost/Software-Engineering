import mongoose from "mongoose";

const WaitlistSchema = new mongoose.Schema({
  name: String,
  contact: String,
  email: String,
  product: String,
  targetSlot: String,
  floor: String,
  status: { type: String, default: 'VERIFICATION_PENDING' },
  
  permitUrl: String,
  validIdUrl: String,
  clearanceUrl: String,
  receiptUrl: String,
  
  paymentReference: String,
  paymentAmount: String,
  
  // Use createdAt from your screenshot, or default to now
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'tenantapplications', // <--- IMPORTANT: Point to existing collection
  timestamps: true // This manages createdAt/updatedAt automatically
});

export default mongoose.model('Waitlist', WaitlistSchema);