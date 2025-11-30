import Waitlist from "../models/Waitlist.js";

export const getWaitlist = async (req, res) => {
  try {
    const list = await Waitlist.find().sort({ dateRequested: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWaitlistByUid = async (req, res) => {
  try {
    const application = await Waitlist.findOne({ uid: req.params.uid });
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createWaitlistEntry = async (req, res) => {
  try {
    const newApp = new Waitlist(req.body);
    await newApp.save();
    res.json({ success: true, message: "Application Saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateWaitlistEntry = async (req, res) => {
  try {
    const updated = await Waitlist.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: req.body }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};