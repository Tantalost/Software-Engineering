const mongoose = require("mongoose");

const BusTripSchema = new mongoose.Schema({
  templateNo: { type: String, required: true },
  route: { type: String, required: true },
  time: { type: String, required: true }, 
  date: { type: Date, required: true },
  company: { type: String, required: true },
  status: { type: String, default: "Active" },
  isArchived: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model("BusTrip", BusTripSchema);