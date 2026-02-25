import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  // Detailed Name Fields (from Mobile)
  firstName: String,     
  middleName: String,    
  lastName: String,   
  tenantName: { type: String, required: true },
  
  // Contact & Identifiers
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  referenceNo: { type: String, required: true }, 
  uid: String, // Links to mobile device/user account
  
  // Stall Details
  slotNo: { type: String, required: true }, 
  tenantType: { type: String, required: true }, // "Permanent" or "Night Market"
  products: String,
  
  // Financials
  rentAmount: Number,
  utilityAmount: Number,
  totalAmount: Number,
  
  // Duration & Status
  StartDateTime: Date,
  DueDateTime: Date,
  status: { type: String, default: "Paid" }, // "Paid", "Due", "Overdue"
  
  // Documents (URLs from Cloudinary or Filenames from GridFS)
  documents: {
    businessPermit: String,
    validID: String,
    barangayClearance: String,
    proofOfReceipt: String,
    contract: String 
  },
  // Meta
  transferWaitlistId: String,
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Defensive export to prevent OverwriteModelError
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
export default Tenant;