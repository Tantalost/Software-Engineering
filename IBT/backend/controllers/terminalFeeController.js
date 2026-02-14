import TerminalFee from "../models/TerminalFee.js";

export const getTerminalFees = async (req, res) => {
  try {
    
    const fees = await TerminalFee.find().sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTerminalFee = async (req, res) => {
  try {
    const newFee = new TerminalFee(req.body);
    await newFee.save();
    res.status(201).json(newFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTerminalFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFee = await TerminalFee.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true } 
    );
    if (!updatedFee) return res.status(404).json({ error: "Record not found" });
    res.json(updatedFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    let regularCount = 0;
    let discountedCount = 0;

    if (regularPrice !== undefined) {
      const regularResult = await TerminalFee.updateMany(
        { passengerType: "Regular" },
        { price: parseFloat(regularPrice) }
      );
      regularCount = regularResult.modifiedCount;
    }

    if (discountedPrice !== undefined) {
      const discountedResult = await TerminalFee.updateMany(
        { 
          $or: [
            { passengerType: "Student" },
            { passengerType: "Senior Citizen / PWD" },
            { passengerType: "Student/Senior/PWD" }
          ]
        },
        { price: parseFloat(discountedPrice) }
      );
      discountedCount = discountedResult.modifiedCount;
    }

    res.json({ 
      message: "Prices updated successfully.",
      regularUpdated: regularCount,
      discountedUpdated: discountedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};