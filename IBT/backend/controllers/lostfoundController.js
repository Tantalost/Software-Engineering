import LostFound from '../models/LostFound.js';

// GET ALL ACTIVE (Includes older documents missing the flag)
export const getLostFound = async (req, res) => {
  try {
    const items = await LostFound.find({ isArchived: { $ne: true } }).sort({ dateTime: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE
export const createLostFound = async (req, res) => {
  try {
    const newItem = new LostFound({
      ...req.body,
      isArchived: false // Ensure it's active on creation
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE
export const updateLostFound = async (req, res) => {
  try {
    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- SOFT DELETE FUNCTIONS (Archive & Restore) ---

export const archiveLostFound = async (req, res) => {
  try {
    const archivedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!archivedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item archived successfully", item: archivedItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreLostFound = async (req, res) => {
  try {
    const restoredItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    if (!restoredItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item restored successfully", item: restoredItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArchivedLostFound = async (req, res) => {
  try {
    const items = await LostFound.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- HARD DELETE ---
export const deleteLostFound = async (req, res) => {
  try {
    const deletedItem = await LostFound.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};