// models/BusTrips.js
import mongoose from "mongoose";

const BusTripSchema = new mongoose.Schema({
  templateNo: { type: String, required: true },
  company: { type: String, required: true },
  route: { type: String, required: true },
  busType: { type: String, enum: ['Aircon', 'Regular'], default: 'Regular' },
  stopType: {
    type: String,
    enum: ['Regular Trip', '1-stop', '2-stop', '3-stop', '4-stop', '5-stop', '6-stop', '7-stop', '8-stop', '9-stop', '10-stop', 'Other'],
    default: 'Regular Trip'
  },
  customStopCount: { type: Number, min: 1, default: null },
  
  time: { type: String, required: true },
  departureTime: { type: String },
  parkingEstimation: { type: String, default: "10 minutes" },
  expectedDeparture: { type: String, default: "" },
  seatingCapacity: { type: Number, min: 1, default: null },
  scheduledTime: { type: String, default: "" },
  date: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: ['Scheduled', 'Arrived', 'Departed', 'On Fix', 'Not Departed', 'Pending', 'Paid', 'System Auto-Cleared'],
    default: "Scheduled" 
  },
  arrivalAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  departureAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  arrivalLoggedAt: { type: Date, default: null },
  departureLoggedAt: { type: Date, default: null },
  
  price: { type: Number, default: 75 },
  ticketReferenceNo: { type: String, default: "" },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("BusTrip", BusTripSchema);