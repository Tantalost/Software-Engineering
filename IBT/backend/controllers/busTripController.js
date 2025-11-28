const BusTrip = require("../models/BusTrips.js");

// Get all bus trips
const getBusTrips = async (req, res) => {
  try {
    // Return all trips that are NOT archived (sorted by newest)
    const trips = await BusTrip.find({ isArchived: false }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new trip
const createBusTrip = async (req, res) => {
  try {
    const newTrip = new BusTrip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a trip
const updateBusTrip = async (req, res) => {
  try {
    const updatedTrip = await BusTrip.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // Return the updated document
    );
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a trip
const deleteBusTrip = async (req, res) => {
  try {
    await BusTrip.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Bus trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBusTrips, createBusTrip, updateBusTrip, deleteBusTrip };