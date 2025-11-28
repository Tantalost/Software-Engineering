import Log from "../models/Log.js";

export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLog = async (req, res) => {
  try {
    const newLog = new Log(req.body);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const clearLogs = async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: "All logs cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};