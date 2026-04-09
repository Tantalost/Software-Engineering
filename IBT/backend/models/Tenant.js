import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
 
  firstName: String,     
  middleName: String,    
  lastName: String,   
  tenantName: { type: String, required: true },
  
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  referenceNo: { 
      type: String, 
      unique: true, 
      sparse: true 
  },
  uid: String, 
  
  slotNo: { type: String, required: true }, 
  tenantType: { type: String, required: true }, 
  products: String,
  
  rentAmount: Number,
  utilityAmount: Number,

  chargeAmount: { type: Number, default: 0 },   
  interestAmount: { type: Number, default: 0 }, 
  
  totalAmount: Number, 

  feeBreakdown: {
    garbageFee: { type: Number, default: 0 },
    permitFee: { type: Number, default: 0 },
    businessTaxes: { type: Number, default: 0 },
    electricity: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    otherAmount: { type: Number, default: 0 },
    otherSpecify: { type: String, default: "" }
  },
  
  StartDateTime: Date,
  DueDateTime: Date,

  advancePaymentBalance: { type: Number, default: 0 },   
  advanceUsedForPenalties: { type: Number, default: 0 },
  
  operationStartDate: Date, 
  isOperationPaused: { type: Boolean, default: false }, 
  lastPausedDate: Date,                               
  totalPausedDays: { type: Number, default: 0 },
  status: { type: String, default: "Paid" }, 

  paymentHistory: [{
    referenceNo: String,
    amount: Number,
    datePaid: Date,
    receiptUrl: String
  }],
  
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
  submitted: { type: Boolean, default: false },
  submittedAt: { type: Date, default: null },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
mongoose.connection.once('open', async () => {
  try { await Tenant.collection.dropIndex('referenceNo_1'); } catch (e) {}
});
export default Tenant;