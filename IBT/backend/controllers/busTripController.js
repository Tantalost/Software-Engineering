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
    const { templateNo, route, time, date, company, status, price, parkingEstimation, expectedDeparture, busType } = req.body;

    if (!templateNo || !route || !company || !busType) {
      return res.status(400).json({ message: "Template, Route, Company, and Bus Type are required." });
    }

    const tripDate = new Date(date);
    const startOfDay = new Date(tripDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tripDate.setHours(23, 59, 59, 999));

    const activeTrip = await BusTrip.findOne({
      templateNo,
      company,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Scheduled", "Pending", "Arrived"] }, 
      isArchived: false
    });

    if (activeTrip) {
      return res.status(400).json({ message: `Bus Number ${templateNo} already has an active trip for this company today.` });
    }

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
      busType, 
      time,
      date,
      company,
      price: price || defaultPrice,
      status: status || "Scheduled", 
      isArchived: false,
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

   
    await Settings.findOneAndUpdate(
      { key: "defaultBusPrice" },
      { key: "defaultBusPrice", value: priceValue },
      { upsert: true, new: true }
    );

   
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


export const getDefaultBusPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultBusPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 75;
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};