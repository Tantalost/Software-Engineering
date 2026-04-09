import mongoose from 'mongoose';
import LostFound from '../models/LostFound.js';
import User from '../models/User.js'; 
import sendPushNotification from '../utils/sendPushNotification.js'; 


const broadcastNotification = async (title, body, data) => {
  try {
    const users = await User.find({ expoPushToken: { $ne: null } });
    users.forEach(user => {
      if (user.expoPushToken && user.expoPushToken.startsWith('ExponentPushToken')) {
        sendPushNotification(user.expoPushToken, title, body, data).catch(err => console.error(err));
      }
    });
  } catch (error) {
    console.error("Broadcast error:", error);
  }
};


export const getLostFound = async (req, res) => {
  try {
    const items = await LostFound.find({
      isArchived: { $ne: true },
      submitted: { $ne: true },
    }).sort({ dateTime: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitLostFoundForShift = async (req, res) => {
  try {
    const { sessionStartedAt, reportId } = req.body;

    if (!sessionStartedAt) {
      return res.status(400).json({ message: "sessionStartedAt is required." });
    }

    const shiftStart = new Date(sessionStartedAt);
    if (Number.isNaN(shiftStart.getTime())) {
      return res.status(400).json({ message: "Invalid sessionStartedAt." });
    }

    const now = new Date();
    const updatePayload = {
      submitted: true,
      submittedAt: now,
    };

    if (reportId) {
      updatePayload.reportId = reportId;
    }

    const result = await LostFound.updateMany(
      {
        createdAt: { $gte: shiftStart, $lte: now },
        isArchived: { $ne: true },
        submitted: { $ne: true },
      },
      { $set: updatePayload },
    );

    return res.status(200).json({
      message: "Shift lost and found records marked as submitted.",
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      reportId: reportId || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


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

   
    broadcastNotification(
      "Lost Item Found 🔍",
      `A ${body.itemType || 'missing item'} was found at ${body.location || 'the terminal'}. Check the app to see if it's yours!`,
      { route: 'lost-found' } 
    );

    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLostFound = async (req, res) => {
  try {
    const update = { ...req.body };


    if (req.file) {
      update.claimEvidence = req.file.filename;
    }

   
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


export const deleteLostFound = async (req, res) => {
  try {
    const deletedItem = await LostFound.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};