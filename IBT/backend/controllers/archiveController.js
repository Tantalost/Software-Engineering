import Archive from "../models/Archive.js";
import TerminalFee from "../models/TerminalFee.js";
 
export const getArchives = async (req, res) => {
  try {
    const archives = await Archive.find().sort({ dateArchived: -1 });
    res.json(archives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteArchive = async (req, res) => {
  try {
    const { id } = req.params;
    await Archive.findByIdAndDelete(id);
    res.json({ message: "Permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restoreArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedItem = await Archive.findById(id);

    if (!archivedItem) return res.status(404).json({ error: "Item not found" });

    const { type, originalData } = archivedItem;

    if (type === "Terminal Fee") {
       
        const { _id, ...restdata } = originalData; 
        const restored = new TerminalFee(restdata);
        await restored.save();
    }
    
    await Archive.findByIdAndDelete(id);

    res.json({ message: "Item restored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createArchive = async (req, res) => {
  try {
    const newArchive = new Archive(req.body);
    await newArchive.save();
    res.status(201).json(newArchive);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};