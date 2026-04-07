import mongoose from "mongoose";

const collectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Collector = mongoose.model("Collector", collectorSchema);
export default Collector;
