import ScheduleNotArrival from "../models/ScheduleNotArrival.js";

export const upsertScheduleNotArrival = async (req, res) => {
  try {
    const { dateKey, company, route, scheduleTime, plateNumber, remark } =
      req.body;

    if (!dateKey || !company || !route || !scheduleTime || !plateNumber) {
      return res.status(400).json({
        message:
          "dateKey, company, route, scheduleTime, and plateNumber are required.",
      });
    }

    const doc = await ScheduleNotArrival.findOneAndUpdate(
      {
        dateKey: String(dateKey).trim(),
        company: String(company).trim(),
        route: String(route).trim(),
        scheduleTime: String(scheduleTime).trim(),
        plateNumber: String(plateNumber).trim(),
      },
      { $set: { remark: remark != null ? String(remark).trim() : "" } },
      { upsert: true, new: true, runValidators: true },
    );

    res.status(200).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listScheduleNotArrivalsByDate = async (req, res) => {
  try {
    const dateKey = req.query.dateKey;
    if (!dateKey) {
      return res.status(400).json({ message: "dateKey query is required." });
    }

    const rows = await ScheduleNotArrival.find({ dateKey: String(dateKey) })
      .sort({ company: 1, route: 1, scheduleTime: 1 })
      .lean();

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteScheduleNotArrival = async (req, res) => {
  try {
    const { dateKey, company, route, scheduleTime, plateNumber } = req.query;

    if (!dateKey || !company || !route || !scheduleTime || !plateNumber) {
      return res.status(400).json({
        message:
          "dateKey, company, route, scheduleTime, and plateNumber query params are required.",
      });
    }

    const deleted = await ScheduleNotArrival.findOneAndDelete({
      dateKey: String(dateKey).trim(),
      company: String(company).trim(),
      route: String(route).trim(),
      scheduleTime: String(scheduleTime).trim(),
      plateNumber: String(plateNumber).trim(),
    });

    if (!deleted) {
      return res.status(404).json({ message: "No matching not-arrival record." });
    }

    res.status(200).json({ message: "Removed." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
