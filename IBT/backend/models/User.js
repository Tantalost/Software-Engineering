import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  
  
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  suffix: { type: String },
  contactNo: { type: String },
  
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isVerified: { type: Boolean, default: false } 
}, { timestamps: true });

export default mongoose.model("User", UserSchema);