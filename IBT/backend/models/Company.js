import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  route: { type: String, required: true },
  busType: { type: String, enum: ['Aircon', 'Regular'], required: true, default: 'Regular' },
  stopType: {
    type: String,
    enum: ['Regular Trip', '1-stop', '2-stop', '3-stop', '5-stop', '10-stop', 'Other'],
    default: 'Regular Trip'
  },
  customStopCount: { type: Number, min: 1, default: null }
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  buses: [BusSchema] 
}, { timestamps: true });

export default mongoose.model("Company", CompanySchema);