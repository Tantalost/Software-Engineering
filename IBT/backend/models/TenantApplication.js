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
      'TENANT',
      'REJECTED' 
    ],
    default: 'VERIFICATION_PENDING'
  },

  adminViewed: { type: Boolean, default: false },
  
  rejectionReason: String, 

  permitUrl: String,
  validIdUrl: String,
  clearanceUrl: String,
  receiptUrl: String,
  contractUrl: String, 
  communityTaxUrl: String,    
  policeClearanceUrl: String, 
  contractSubmittedAt: Date,
  paymentReference: String,
  paymentAmount: String,
  paymentSubmittedAt: Date,
  defaultTemplateId: String,
  defaultContractDurationMonths: Number,
  defaultContractType: {
    type: String,
    enum: ['INITIAL', 'RENEWAL'],
    default: 'INITIAL'
  },

}, { timestamps: true });

export default mongoose.model("TenantApplication", TenantApplicationSchema);