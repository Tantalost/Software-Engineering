import mongoose from "mongoose";

const terminalFeeSchema = new mongoose.Schema({
  ticketNo: {
    type: String,
    required: true,
    unique: true
  },
  passengerType: {
    type: String,
    required: true,
    enum: ["Regular", "Student", "Senior Citizen / PWD", "Student/Senior/PWD"]
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: String, 
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Active"
  },
  reportStatus: {
    type: String,
    enum: ["Pending", "On Read"],
    default: "Pending"
  },
  submitted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    default: null,
  },
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model("TerminalFee", terminalFeeSchema);