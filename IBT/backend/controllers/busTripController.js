import BusTrip from "../models/BusTrips.js";
import Settings from "../models/Settings.js";

export const getBusTrips = async (req, res) => {
  try {
    const trips = await BusTrip.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBusTrip = async (req, res) => {
  try {
    // FIX: Add parkingEstimation and expectedDeparture to this line
    const { templateNo, route, time, date, company, status, price, parkingEstimation, expectedDeparture } = req.body;

    if (!templateNo || !route || !company) {
      return res.status(400).json({ message: "Template, Route, and Company are required." });
    }

    // Get default price from settings if price is not provided
    let defaultPrice = 75;
    if (!price) {
      const priceSetting = await Settings.findOne({ key: "defaultBusPrice" });
      if (priceSetting) {
        defaultPrice = Number(priceSetting.value);
      }
    }

    const newTrip = new BusTrip({
      templateNo,
      route,
      time,
      date,
      company,
      price: price || defaultPrice,
      status: status || "Pending",
      isArchived: false,
      // Now these variables actually exist!
      parkingEstimation: parkingEstimation || "10 minutes",
      expectedDeparture: expectedDeparture || ""
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

export const archiveBusTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedTrip = await BusTrip.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );

    if (!archivedTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    res.status(200).json({ message: "Bus trip archived successfully", trip: archivedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreBusTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredTrip = await BusTrip.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true }
    );

    if (!restoredTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    res.status(200).json({ message: "Bus trip restored successfully", trip: restoredTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArchivedBusTrips = async (req, res) => {
  try {
    const trips = await BusTrip.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

export const updateAllBusTripPrices = async (req, res) => {
  try {
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ message: "Valid price is required." });
    }

    const priceValue = parseFloat(newPrice);

    // Update or create the default price setting in database
    await Settings.findOneAndUpdate(
      { key: "defaultBusPrice" },
      { key: "defaultBusPrice", value: priceValue },
      { upsert: true, new: true }
    );

    // Update all pending trips with new price
    const result = await BusTrip.updateMany(
      { status: "Pending" },
      { price: priceValue }
    );

    res.status(200).json({
      message: `Updated ${result.modifiedCount} pending bus trips with new price.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get default bus price from settings
export const getDefaultBusPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultBusPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 75;
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};