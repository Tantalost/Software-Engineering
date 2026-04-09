import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  route: { type: String, required: true },
  busType: { type: String, enum: ['Aircon', 'Regular'], required: true, default: 'Regular' },
  seatingCapacity: { type: Number, min: 1, default: null },
  departureTime: { type: String, default: '' },
  scheduleTime: { type: String, default: '' },
  /** Multiple daily trip departures, e.g. ["1:00 AM", "5:00 PM"]. Legacy buses use scheduleTime only. */
  scheduleTimes: { type: [String], default: undefined },
  stopType: {
    type: String,
    enum: ['Regular Trip', '1-stop', '2-stop', '3-stop', '4-stop', '5-stop', '6-stop', '7-stop', '8-stop', '9-stop', '10-stop', 'Other'],
    default: 'Regular Trip'
  },
  customStopCount: { type: Number, min: 1, default: null }
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  buses: [BusSchema] 
}, { timestamps: true });

export default mongoose.model("Company", CompanySchema);