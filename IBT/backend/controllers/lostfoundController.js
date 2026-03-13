import mongoose from 'mongoose';
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
    const body = req.body || {};

    const newItem = new LostFound({
      trackingNo: body.trackingNo,
      itemType: body.itemType,
      location: body.location,
      dateTime: body.dateTime,
      status: body.status || 'Unclaimed',
      isArchived: false,
      photoFilename: req.file ? req.file.filename : undefined,
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
    const update = { ...req.body };

    // NEW: If an evidence photo was uploaded, save its filename
    if (req.file) {
      update.claimEvidence = req.file.filename;
    }

    // If status moved to Claimed and no claimedAt provided, stamp it
    if (update.status === 'Claimed' && !update.claimedAt) {
      update.claimedAt = new Date();
    }

    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );

    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
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

export const getLostFoundPhoto = async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });

    const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
    downloadStream.on('data', (chunk) => res.write(chunk));
    downloadStream.on('error', () => res.status(404).json({ message: 'Image not found' }));
    downloadStream.on('end', () => res.end());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching image' });
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