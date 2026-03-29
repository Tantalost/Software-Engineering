import BusTrip from "../models/BusTrips.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import sendPushNotification from "../utils/sendPushNotification.js"; 


const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${parts[1]} ${ampm}`;
};


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
    const {
      templateNo,
      route,
      time,
      date,
      company,
      status,
      price,
      parkingEstimation,
      expectedDeparture,
      busType,
      stopType,
      customStopCount,
    } = req.body;

    if (!templateNo || !route || !company || !busType || !stopType) {
      return res.status(400).json({ message: "Template, Route, Company, Bus Type, and Stop Type are required." });
    }

    if (stopType === "Other" && (!customStopCount || Number(customStopCount) < 1)) {
      return res.status(400).json({ message: "Custom stop count is required for 'Other' stop type." });
    }

    const tripDate = new Date(date);
    const startOfDay = new Date(tripDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tripDate.setHours(23, 59, 59, 999));

    const activeTrip = await BusTrip.findOne({
      templateNo,
      company,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Scheduled", "Pending", "Arrived", "On Fix", "Not Departed"] }, 
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
      stopType,
      customStopCount: stopType === "Other" ? Number(customStopCount) : null,
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

    
    broadcastNotification(
      "New Bus Scheduled 🚌",
      `${company} bus to ${route} is scheduled at ${formatTime(time)}.`,
      { route: 'routes' }
    );

    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBusTrip = async (req, res) => {
  try {
    const { id } = req.params;

  
    const oldTrip = await BusTrip.findById(id);
    if (!oldTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

   
    if (oldTrip.status !== 'Arrived' && updatedTrip.status === 'Arrived') {
      broadcastNotification(
        "Bus Arrived 📍",
        `${updatedTrip.company} bus to/from ${updatedTrip.route} has arrived at the terminal.`,
        { route: 'routes' }
      );
    } 
  
    else if (req.body.expectedDeparture && req.body.expectedDeparture !== oldTrip.expectedDeparture) {
      broadcastNotification(
        "Bus Delayed ⏳",
        `${updatedTrip.company} bus for ${updatedTrip.route} is delayed. New departure: ${formatTime(updatedTrip.expectedDeparture)}.`,
        { route: 'routes' }
      );
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

export const approveDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const { ticketReferenceNo } = req.body;

    const trip = await BusTrip.findById(id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      {
        status: "Departed",
        ticketReferenceNo: ticketReferenceNo || `AUTO-${Date.now().toString().slice(-6)}`,
        departureTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      },
      { new: true }
    );

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};