import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  slotNo: String,      
  tenantName: String,
  referenceNo: String,
  email: String,
  contactNo: String,
  tenantType: String,    
  products: String,
  
  rentAmount: Number,
  utilityAmount: Number,
  totalAmount: Number,
  
  StartDateTime: Date,
  DueDateTime: Date,
  
  status: { type: String, default: "Paid" },
  
  documents: {
    businessPermit: String,
    validID: String,
    barangayClearance: String,
    proofOfReceipt: String
  },
  
  uid: String, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Tenant', TenantSchema);