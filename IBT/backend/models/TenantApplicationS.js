import mongoose from "mongoose";

const TenantApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true },// Replaces Firebase UID
  name: String,
  contact: String,
  email: String,
  product: String,
  targetSlot: String,
  floor: String,
  
  // UPDATED STATUS: Added CONTRACT_PENDING and CONTRACT_REVIEW
  status: { 
    type: String, 
    enum: [
      'VERIFICATION_PENDING', 
      'PAYMENT_UNLOCKED', 
      'PAYMENT_REVIEW', 
      'CONTRACT_PENDING', // <--- New
      'CONTRACT_REVIEW',  // <--- New
      'TENANT'
    ],
    default: 'VERIFICATION_PENDING'
  },
  
  // Images stored as Base64 strings
  permitUrl: String,
  validIdUrl: String,
  clearanceUrl: String,
  receiptUrl: String,

  // --- ADD THIS FOR THE CONTRACT ---
  contractUrl: String,         // Stores the signed contract image
  contractSubmittedAt: Date,   // Tracks when they uploaded it
  // --------------------------------

  // Payment Details
  paymentReference: String,
  paymentAmount: String,
  paymentSubmittedAt: Date,

}, { timestamps: true });

export default mongoose.model("TenantApplication", TenantApplicationSchema);