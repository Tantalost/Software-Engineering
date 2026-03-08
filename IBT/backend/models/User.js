import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  contactNo: { type: String },
  
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);