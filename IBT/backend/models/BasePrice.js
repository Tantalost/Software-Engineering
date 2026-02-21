import mongoose from "mongoose";

const BasePriceSchema = new mongoose.Schema({
  regular: { type: Number, default: 0 },
  discounted: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("BasePrice", BasePriceSchema);