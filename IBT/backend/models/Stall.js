import mongoose from "mongoose";

const StallSchema = new mongoose.Schema({
  stallId: { type: String, unique: true }, 
  slotNo: String,      
  floor: String,       
  row: Number,
  col: Number,
  status: String,      
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
});

export default mongoose.model('Stall', StallSchema);