// models/BusTrips.js
import mongoose from "mongoose";

const BusTripSchema = new mongoose.Schema({
  templateNo: { type: String, required: true },
  company: { type: String, required: true },
  route: { type: String, required: true },
  busType: { type: String, enum: ['Aircon', 'Regular'], default: 'Regular' },
  
  time: { type: String, required: true },
  departureTime: { type: String },        
  date: { type: Date, required: true },
  
  // <-- UPDATED SEAT TRACKING -->
  totalSeats: { type: Number, required: true, default: 50 },
  currentPassengers: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['Scheduled', 'Arrived', 'Departed', 'On Fix', 'Pending', 'Paid'],
    default: "Scheduled" 
  },
  
  price: { type: Number, default: 75 },
  ticketReferenceNo: { type: String, default: "" },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("BusTrip", BusTripSchema);