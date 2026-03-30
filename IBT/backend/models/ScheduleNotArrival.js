import mongoose from "mongoose";

const ScheduleNotArrivalSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true },
    company: { type: String, required: true },
    route: { type: String, required: true },
    scheduleTime: { type: String, required: true },
    plateNumber: { type: String, required: true },
    remark: { type: String, default: "" },
  },
  { timestamps: true },
);

ScheduleNotArrivalSchema.index(
  { dateKey: 1, company: 1, route: 1, scheduleTime: 1, plateNumber: 1 },
  { unique: true },
);

export default mongoose.model("ScheduleNotArrival", ScheduleNotArrivalSchema);
