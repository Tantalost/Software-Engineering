import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
 
  firstName: String,     
  middleName: String,    
  lastName: String,   
  tenantName: { type: String, required: true },
  
 
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  referenceNo: { type: String, required: true }, 
  uid: String, 
  

  slotNo: { type: String, required: true }, 
  tenantType: { type: String, required: true }, 
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
    proofOfReceipt: String,
    contract: String,
    communityTax: String,    
    policeClearance: String
  },

  transferWaitlistId: String,
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});


const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
export default Tenant;