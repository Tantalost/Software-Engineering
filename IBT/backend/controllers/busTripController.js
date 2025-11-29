import BusTrip from "../models/BusTrips.js";

export const getBusTrips = async (req, res) => {
  try {
    const trips = await BusTrip.find({ isArchived: false }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBusTrip = async (req, res) => {
  try {
    const { templateNo, route, time, date, company, status } = req.body;

    if (!templateNo || !route || !company) {
      return res.status(400).json({ message: "Template, Route, and Company are required." });
    }

    const newTrip = new BusTrip({
      templateNo,
      route,
      time,
      date,
      company,
      status: status || "Pending",
      isArchived: false
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBusTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      req.body, 
      { new: true } 
    );

    if (!updatedTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBusTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTrip = await BusTrip.findByIdAndDelete(id);

    if (!deletedTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    res.status(200).json({ message: "Bus trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};