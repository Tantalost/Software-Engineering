import TerminalFee from "../models/TerminalFee.js";
import BasePrice from "../models/BasePrice.js";
import Counter from "../models/Counter.js";

export const getNextTicketNumber = async (req, res) => {
  try {
    let nextNumber = 1;
    const counter = await Counter.findOne({ id: "ticketNo" });

    if (counter) {
      // If the counter exists, the next ticket is simply the current sequence + 1
      nextNumber = counter.seq + 1;
    } else {
      // If the counter hasn't been created yet, calculate it exactly like the pre-save hook does
      const result = await TerminalFee.aggregate([
        { $addFields: { numericTicketNo: { $toInt: "$ticketNo" } } },
        { $sort: { numericTicketNo: -1 } },
        { $limit: 1 }
      ]);
      const maxTicket = result.length > 0 && result[0].numericTicketNo ? result[0].numericTicketNo : 0;
      nextNumber = maxTicket + 1;
    }

    res.json({ nextTicketNo: nextNumber });
  } catch (error) {
    console.error("Error fetching next ticket number:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getTerminalFees = async (req, res) => {
  try {
    const fees = await TerminalFee.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTerminalFee = async (req, res) => {
  try {
   
    const basePrices = await BasePrice.findOne({});
    const price =
      req.body.price !== undefined
        ? req.body.price
        : req.body.passengerType === "Regular"
        ? basePrices?.regular || 0
        : basePrices?.discounted || 0;

    const newFee = new TerminalFee({
      ...req.body,
      isArchived: false,
      price
    });

     await newFee.save();
    res.status(201).json(newFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

}; 


export const updateTerminalFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFee = await TerminalFee.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFee) return res.status(404).json({ error: "Record not found" });
    res.json(updatedFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const archiveTerminalFee = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedFee = await TerminalFee.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );
    if (!archivedFee) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Terminal fee archived successfully", fee: archivedFee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreTerminalFee = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredFee = await TerminalFee.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true }
    );
    if (!restoredFee) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Terminal fee restored successfully", fee: restoredFee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchivedTerminalFees = async (req, res) => {
  try {
    const fees = await TerminalFee.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTerminalFee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TerminalFee.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTerminalFeePrices = async (req, res) => {
  try {
    const { regularPrice, discountedPrice } = req.body;


    if (regularPrice !== undefined && (isNaN(regularPrice) || regularPrice < 0)) {
      return res.status(400).json({ error: "Valid regular price is required." });
    }


    if (discountedPrice !== undefined && (isNaN(discountedPrice) || discountedPrice < 0)) {
      return res.status(400).json({ error: "Valid discounted price is required." });
    }

    const updatedBase = await BasePrice.findOneAndUpdate(
      {},
      {
        regular: regularPrice !== undefined ? parseFloat(regularPrice) : undefined,
        discounted: discountedPrice !== undefined ? parseFloat(discountedPrice) : undefined
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Base prices updated successfully. Only new tickets will use these prices.",
      basePrices: updatedBase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};