import Parking from "../models/Parking.js";

export const getParkingTickets = async (req, res) => {
  try {
    const tickets = await Parking.find({
      isArchived: { $ne: true },
      submitted: { $ne: true },
    }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitParkingForShift = async (req, res) => {
  try {
    const { sessionStartedAt, reportId } = req.body;
    
    const now = new Date();
    const updatePayload = {
      submitted: true,
      submittedAt: now,
    };

    if (reportId) {
      updatePayload.reportId = reportId;
    }

    const result = await Parking.updateMany(
      {
        isArchived: { $ne: true },
        submitted: { $ne: true },
        status: "Departed", 
      },
      { $set: updatePayload },
    );

    res.status(200).json({
      message: "Shift parking tickets marked as submitted.",
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      reportId: reportId || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const createParking = async (req, res) => {
  try {
    const { ticketNo, plateNo, type, baseRate, timeIn } = req.body;

    const newTicket = new Parking({
      ticketNo,
      plateNo,
      type,
      baseRate, 
      timeIn: timeIn || new Date(), 
      status: "Parked",
      finalPrice: 0,
      isArchived: false
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const departParking = async (req, res) => {
  try {
    console.log("DEPART API HIT:", req.params.id);
    const { id } = req.params;
    const parkingRecord = await Parking.findById(id);

    if (!parkingRecord) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const timeOut = new Date();
const timeIn = new Date(parkingRecord.timeIn);

const diffMs = timeOut - timeIn;
const duration = diffMs / (1000 * 60 * 60);

const hours = Math.floor(duration);
const minutes = Math.round((duration - hours) * 60);
const durationText = `${hours} hours ${minutes} minutes`;

let finalPrice = 0;

if (parkingRecord.type === "4 Wheels") {
  const base = parkingRecord.baseRate;

  if (duration <= 3) {
    finalPrice = base;
  } else {
    const extraHours = Math.ceil(duration - 3);
    finalPrice = base + extraHours * base;
  }
}

else if (parkingRecord.type === "2 Wheels") {
  const base = parkingRecord.baseRate;

  if (duration <= 3) {
    finalPrice = base;
  } else {
    const extraHours = Math.ceil(duration - 3);
    finalPrice = base + extraHours * base;
  }
}

else if (parkingRecord.type === "Jeep") {
  finalPrice = parkingRecord.baseRate;
}

parkingRecord.timeOut = timeOut;
parkingRecord.duration = String(durationText);
parkingRecord.finalPrice = finalPrice;
parkingRecord.status = "Departed";

const updatedRecord = await parkingRecord.save();
res.status(200).json(updatedRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateParking = async (req, res) => {
  try {
    const updated = await Parking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const archiveParking = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedTicket = await Parking.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );
    if (!archivedTicket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Parking ticket archived successfully", ticket: archivedTicket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreParking = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredTicket = await Parking.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true }
    );
    if (!restoredTicket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Parking ticket restored successfully", ticket: restoredTicket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArchivedParkingTickets = async (req, res) => {
  try {
    const tickets = await Parking.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteParking = async (req, res) => {
  try {
    await Parking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNextParkingTicketNumber = async (req, res) => {
  try {
  
    const latestTicket = await Parking.findOne().sort({ createdAt: -1 });

    let nextTicketNo = "T-01"; 

    if (latestTicket && latestTicket.ticketNo) {
      const lastTicketStr = latestTicket.ticketNo.trim();

      const match = lastTicketStr.match(/^(.*?)(\d+)$/);

      if (match) {
        const prefix = match[1]; 
        const numberStr = match[2]; 

        const nextNum = parseInt(numberStr, 10) + 1;

        const paddedNum = nextNum.toString().padStart(numberStr.length, "0");

        nextTicketNo = `${prefix}${paddedNum}`;
      } else {
        nextTicketNo = `${lastTicketStr}-01`;
      }
    }

    res.json({ nextTicketNo });
  } catch (error) {
    console.error("Error fetching next parking ticket number:", error);
    res.status(500).json({ error: "Server error" });
  }
};