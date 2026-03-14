import mongoose from "mongoose"; 

const BusTripSchema = new mongoose.Schema({
  templateNo: { type: String, required: true },
  route: { type: String, required: true },
 
  busType: { type: String, enum: ['Aircon', 'Regular'], required: true, default: 'Regular' },
  time: { type: String, required: true }, 
  departureTime: { type: String },        
  date: { type: Date, required: true },
  company: { type: String, required: true },
  price: { type: Number, default: 75 },
  
  status: { type: String, default: "Scheduled" }, 
  ticketReferenceNo: { type: String, default: "" }, 
  isArchived: { type: Boolean, default: false },
  parkingEstimation: { type: String, default: "10 minutes" },
  expectedDeparture: { type: String }
}, { timestamps: true });

export default mongoose.model("BusTrip", BusTripSchema);