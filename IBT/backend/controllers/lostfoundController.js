import LostFound from "../models/LostFound.js";

// GET ALL (Non-archived)
export const getLostFound = async (req, res) => {
  try {
    const items = await LostFound.find({ isArchived: false }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE
export const createLostFound = async (req, res) => {
  try {
    const newItem = new LostFound(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE (Handles edits and archiving)
export const updateLostFound = async (req, res) => {
  try {
    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE (Hard Delete)
export const deleteLostFound = async (req, res) => {
  try {
    await LostFound.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};