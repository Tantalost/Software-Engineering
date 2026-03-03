import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  resetToken: { type: String }, 
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL Index: Automatically delete the document from MongoDB after it expires
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PasswordReset", passwordResetSchema);