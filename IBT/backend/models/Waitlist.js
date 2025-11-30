import mongoose from "mongoose";

const WaitlistSchema = new mongoose.Schema({
  uid: { type: String, required: true },
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
  
  dateRequested: { type: Date, default: Date.now }
}, { collection: 'tenantapplications' }); // <--- FORCE COLLECTION NAME

export default mongoose.model('Waitlist', WaitlistSchema);