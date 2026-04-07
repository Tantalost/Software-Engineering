import mongoose from "mongoose";

const departmentEnum = ["Bus", "Parking", "Terminal Fee", "Tenant"];

const collectorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    suffix: {
      type: String,
      trim: true,
      default: "",
    },
    contactNumber: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },
    assignedShift: {
      type: String,
      required: true,
      trim: true,
    },
    assignedDepartment: {
      type: [String],
      enum: departmentEnum,
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

collectorSchema.index(
  { firstName: 1, middleName: 1, lastName: 1, suffix: 1, contactNumber: 1 },
  { unique: true },
);

const Collector = mongoose.model("Collector", collectorSchema);
export default Collector;
