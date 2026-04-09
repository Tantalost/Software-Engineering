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

export const getPredefinedTodayTrips = async (_req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await BusTrip.find({
      isArchived: { $ne: true },
      status: "Scheduled",
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ date: 1, scheduledTime: 1, createdAt: 1 });

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDispatchBoardTrips = async (_req, res) => {
  try {
    const trips = await BusTrip.find({
      isArchived: { $ne: true },
      status: { $in: ["Arrived", "On Fix", "Not Departed"] },
    }).sort({ updatedAt: -1 });

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
      seatingCapacity,
      scheduledTime,
      busType,
      stopType,
      customStopCount,
      arrivalAdminId,
      arrivalLoggedAt,
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
      expectedDeparture: expectedDeparture || "",
      scheduledTime: scheduledTime ? String(scheduledTime).trim() : "",
      seatingCapacity:
        seatingCapacity != null && !Number.isNaN(Number(seatingCapacity))
          ? Number(seatingCapacity)
          : null,
      arrivalAdminId: arrivalAdminId || null,
      arrivalLoggedAt: arrivalLoggedAt ? new Date(arrivalLoggedAt) : null,
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

const normalizeTicketReference = (value = "") => String(value).trim();

const generateAutoTicketReference = async () => {
  for (let i = 0; i < 5; i += 1) {
    const candidate = `AUTO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const existing = await BusTrip.exists({ ticketReferenceNo: candidate });
    if (!existing) return candidate;
  }
  return `AUTO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
};

export const updateBusTrip = async (req, res) => {
  try {
    const { id } = req.params;

  
    const oldTrip = await BusTrip.findById(id);
    if (!oldTrip) {
      return res.status(404).json({ message: "Bus trip not found" });
    }

    const incomingTicketReferenceNo = normalizeTicketReference(
      req.body.ticketReferenceNo,
    );

    if (incomingTicketReferenceNo) {
      const duplicateReference = await BusTrip.findOne({
        _id: { $ne: id },
        ticketReferenceNo: incomingTicketReferenceNo,
      }).select("_id");

      if (duplicateReference) {
        return res.status(409).json({
          message: `Ticket Reference No. \"${incomingTicketReferenceNo}\" already exists.`,
        });
      }
    }

    const updatePayload = {
      ...req.body,
      ...(incomingTicketReferenceNo
        ? { ticketReferenceNo: incomingTicketReferenceNo }
        : {}),
      ...(req.body.status === "Arrived"
        ? {
            arrivalAdminId: req.body.actionAdminId || oldTrip.arrivalAdminId || null,
            arrivalLoggedAt: new Date(),
          }
        : {}),
    };

    if (
      !incomingTicketReferenceNo &&
      Object.prototype.hasOwnProperty.call(req.body, "ticketReferenceNo")
    ) {
      delete updatePayload.ticketReferenceNo;
    }

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      updatePayload,
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
    const { ticketReferenceNo, actionAdminId } = req.body;

    const trip = await BusTrip.findById(id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const normalizedTicketReferenceNo = normalizeTicketReference(ticketReferenceNo);

    if (normalizedTicketReferenceNo) {
      const duplicateReference = await BusTrip.findOne({
        _id: { $ne: id },
        ticketReferenceNo: normalizedTicketReferenceNo,
      }).select("_id");

      if (duplicateReference) {
        return res.status(409).json({
          message: `Ticket Reference No. \"${normalizedTicketReferenceNo}\" already exists.`,
        });
      }
    }

    const finalTicketReferenceNo =
      normalizedTicketReferenceNo || (await generateAutoTicketReference());

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      {
        status: "Departed",
        ticketReferenceNo: finalTicketReferenceNo,
        departureTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        departureAdminId: actionAdminId || trip.departureAdminId || null,
        departureLoggedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};