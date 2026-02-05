import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  route: { type: String, required: true }
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  buses: [BusSchema] // Embeds the bus list directly in the company document
}, { timestamps: true });

export default mongoose.model("Company", CompanySchema);