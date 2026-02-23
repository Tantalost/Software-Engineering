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
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const TerminalFee = mongoose.model("TerminalFee", terminalFeeSchema);
export default TerminalFee;