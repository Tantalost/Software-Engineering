import Waitlist from "../models/Waitlist.js";

export const getWaitlist = async (req, res) => {
  try {
    // Sort by createdAt (newest first)
    const list = await Waitlist.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWaitlistById = async (req, res) => {
  try {
    const application = await Waitlist.findById(req.params.id);
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createWaitlistEntry = async (req, res) => {
  try {
    const newApp = new Waitlist(req.body);
    await newApp.save();
    res.json({ success: true, message: "Application Saved", data: newApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateWaitlistEntry = async (req, res) => {
  try {
    const updated = await Waitlist.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteWaitlistEntry = async (req, res) => {
  try {
    await Waitlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Waitlist entry removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};