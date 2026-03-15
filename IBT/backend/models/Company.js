import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  route: { type: String, required: true },
  
  busType: { type: String, enum: ['Aircon', 'Regular'], required: true, default: 'Regular' } 
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  buses: [BusSchema] 
}, { timestamps: true });

export default mongoose.model("Company", CompanySchema);