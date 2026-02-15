import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  // --- Personal Information ---
  firstName: String,     // Optional: If you want to store them separately
  middleName: String,    // Optional
  lastName: String,      // Optional
  tenantName: { type: String, required: true }, // The combined full name used in tables

  // --- Contact Information ---
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  
  // --- Lease Details ---
  referenceNo: { type: String, required: true, unique: true },
  slotNo: { type: String, required: true }, // e.g., "A-101" or "A-101, A-102"
  tenantType: { type: String, required: true }, // "Permanent" or "Night Market"
  products: String,
  
  // --- Financials ---
  rentAmount: Number,
  utilityAmount: Number,
  totalAmount: Number,
  
  // --- Duration ---
  StartDateTime: Date,
  DueDateTime: Date,
  
  // --- Status ---
  status: { type: String, default: "Paid" }, // "Paid", "Due", "Overdue"
  
  // --- Documents (URLs from Cloudinary) ---
  documents: {
    businessPermit: String,
    validID: String,
    barangayClearance: String,
    proofOfReceipt: String,
    contract: String // <--- Added this to store the Signed Contract
  },
  
  // --- Meta ---
  uid: String, // Links back to the mobile deviceId/TenantApplication if needed
  transferWaitlistId: String, // If they came from the waitlist
  
}, { timestamps: true });

export default mongoose.model('Tenant', TenantSchema);