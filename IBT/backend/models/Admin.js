import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    suffix: {
      type: String,
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
    assignedShift: {
      type: String,
      enum: ["00-06", "06-12", "12-18", "18-24", null],
      default: null,
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
    knownDevices: [{
      type: String,
    }],
    recoveryCodes: [{
      type: String,
    }],
  },
  { timestamps: true }
);

adminSchema.index(
  { role: 1, assignedShift: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: { $ne: "superadmin" },
      assignedShift: { $exists: true, $type: "string" },
    },
  },
);

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;