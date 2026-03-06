import mongoose from "mongoose";
const Counter = require("./Counter");

const terminalFeeSchema = new mongoose.Schema({
  ticketNo: {
    type: String,
    required: true,
    unique: true
  },
  passengerType: {
    type: String,
    required: true,
    enum: ["Regular", "Student", "Senior Citizen / PWD", "Student/Senior/PWD"]
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: String, 
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Active"
  },
  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

terminalFeeSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // 1. Try to increment the counter
      let counter = await Counter.findOneAndUpdate(
        { id: "ticketNo" },
        { $inc: { seq: 1 } },
        { new: true }
      );

      // 2. If no counter exists yet, seed it based on your existing highest ticket
      if (!counter) {
        const result = await mongoose.model("TerminalFee").aggregate([
          { $addFields: { numericTicketNo: { $toInt: "$ticketNo" } } },
          { $sort: { numericTicketNo: -1 } },
          { $limit: 1 }
        ]);
        
        const maxTicket = result.length > 0 && result[0].numericTicketNo ? result[0].numericTicketNo : 0;
        
        counter = await Counter.create({ 
          id: "ticketNo", 
          seq: maxTicket + 1 
        });
      }

      // 3. Assign the sequence to the ticket and proceed
      this.ticketNo = counter.seq.toString();
      next();
    } catch (error) {
      return next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model("TerminalFee", terminalFeeSchema);