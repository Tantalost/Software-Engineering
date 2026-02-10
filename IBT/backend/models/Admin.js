import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["superadmin", "bus", "lease", "lostfound", "parking", "ticket"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    otpCode: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Enforce one admin per role (page). Superadmin is treated as its own role.
adminSchema.index({ role: 1 }, { unique: true });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;