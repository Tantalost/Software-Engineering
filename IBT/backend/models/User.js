import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In production, hash this with bcrypt!
  fullName: { type: String, required: true },
  contactNo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);