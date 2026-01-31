import mongoose from "mongoose";

const TenantApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  
  name: String,
  contact: String,
  email: String,
  product: String,
  targetSlot: String,
  floor: String,
  
  status: { 
    type: String, 
    enum: [
      'VERIFICATION_PENDING', 
      'PAYMENT_UNLOCKED', 
      'PAYMENT_REVIEW', 
      'CONTRACT_PENDING', 
      'CONTRACT_REVIEW', 
      'TENANT'
    ],
    default: 'VERIFICATION_PENDING'
  },
  permitUrl: String,
  validIdUrl: String,
  clearanceUrl: String,
  receiptUrl: String,
  contractUrl: String,   
  contractSubmittedAt: Date,
  paymentReference: String,
  paymentAmount: String,
  paymentSubmittedAt: Date,

}, { timestamps: true });

export default mongoose.model("TenantApplication", TenantApplicationSchema);