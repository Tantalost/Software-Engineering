import mongoose from "mongoose";

const normalizeContractTypeValue = (value) => {
  return String(value || "").toUpperCase() === "INITIAL" ? "INITIAL" : "RENEWAL";
};

const TenantContractSchema = new mongoose.Schema(
  {
    contractType: {
      type: String,
      enum: ["INITIAL", "RENEWAL"],
      default: "INITIAL",
      set: normalizeContractTypeValue
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationMonths: { type: Number, required: true, min: 1 },
    duration: {
      years: { type: Number, default: 0, min: 0 },
      months: { type: Number, default: 0, min: 0, max: 11 }
    },
    documentUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "superseded", "expired", "terminated", "pending_approval", "approved_awaiting_start", "rejected"],
      default: "inactive"
    },
    source: {
      type: String,
      enum: ["legacy", "admin", "system", "tenant"],
      default: "admin"
    },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    assignedAt: { type: Date, default: Date.now },
    templateId: { type: String, default: "" },
    templateName: { type: String, default: "" },
    requestedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectedReason: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { _id: true }
);

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
  overdueChargePercentage: { type: Number, default: null },
  overdueInterestPercentage: { type: Number, default: null },
  overdueCycleCount: { type: Number, default: 0 },
  lastOverdueAppliedAt: { type: Date, default: null },
  
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
  operationPauseReason: {
    type: String,
    validate: {
      validator: (value) => value == null || ["MANUAL", "NON_PAYMENT_2_MONTHS", "NIGHT_MARKET_NON_PAYMENT"].includes(value),
      message: "Invalid operation pause reason",
    },
    default: null,
  },
  lastPausedDate: Date,                               
  totalPausedDays: { type: Number, default: 0 },
  nightMarketTerminationAt: { type: Date, default: null },
  nightMarketTerminationWarningNotifiedAt: { type: Date, default: null },
  status: { type: String, default: "Paid" }, 

  paymentHistory: [{
    referenceNo: String,
    amount: Number,
    datePaid: Date,
    receiptUrl: String,
    contractId: { type: mongoose.Schema.Types.ObjectId, default: null },
    coverageStartDate: Date,
    coverageEndDate: Date
  }],

  // New dynamic contract model. Keep StartDateTime/DueDateTime for backward compatibility.
  activeContractId: { type: mongoose.Schema.Types.ObjectId, default: null },
  contracts: {
    type: [TenantContractSchema],
    default: []
  },
  isEligibleForRenewal: { type: Boolean, default: false },
  renewalEligibilityNotifiedAt: { type: Date, default: null },
  renewalEligibilityEmailNotifiedAt: { type: Date, default: null },
  
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

TenantSchema.pre("validate", function normalizeContractTypes(next) {
  if (Array.isArray(this.contracts)) {
    this.contracts.forEach((contract) => {
      contract.contractType = normalizeContractTypeValue(contract.contractType);
    });
  }
  next();
});

TenantSchema.methods.getActiveContract = function getActiveContract() {
  if (!Array.isArray(this.contracts) || this.contracts.length === 0) return null;

  if (this.activeContractId) {
    const byId = this.contracts.find((contract) => String(contract._id) === String(this.activeContractId));
    if (byId) return byId;
  }

  const byStatus = this.contracts.find((contract) => contract.status === "active");
  return byStatus || this.contracts[this.contracts.length - 1];
};

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
mongoose.connection.once('open', async () => {
  try { await Tenant.collection.dropIndex('referenceNo_1'); } catch (e) {}
});
export default Tenant;