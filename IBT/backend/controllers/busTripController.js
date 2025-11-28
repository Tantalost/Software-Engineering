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
    const newTrip = new BusTrip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBusTrip = async (req, res) => {
  try {
    const updatedTrip = await BusTrip.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBusTrip = async (req, res) => {
  try {
    await BusTrip.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Bus trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

