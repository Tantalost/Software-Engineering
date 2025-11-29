import Parking from "../models/Parking.js";

// GET ALL
export const getParkingTickets = async (req, res) => {
  try {
    const tickets = await Parking.find({ isArchived: false }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE (Entry)
export const createParking = async (req, res) => {
  try {
    const { ticketNo, plateNumber, type, baseRate, timeIn } = req.body;

    const newTicket = new Parking({
      ticketNo,
      plateNumber,
      type,
      baseRate, // Store the rate (e.g. 50 or 20)
      timeIn: timeIn || new Date(), // Use provided time or current server time
      status: "Parked",
      finalPrice: 0 // Price is 0 while parked
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DEPART (Calculate Duration & Price)
export const departParking = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingRecord = await Parking.findById(id);

    if (!parkingRecord) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 1. Get Current Time (Time Out)
    const timeOut = new Date();
    const timeIn = new Date(parkingRecord.timeIn);

    // 2. Calculate Duration in Hours
    // Difference in milliseconds
    const diffMs = timeOut - timeIn; 
    // Convert to hours (ms / 1000 / 60 / 60)
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Round up to the nearest hour (e.g., 1.1 hours becomes 2 hours) 
    // OR use Math.floor if you want exact hours. Standard parking is usually Math.ceil.
    const billedHours = Math.ceil(diffHours); 
    
    // Ensure minimum 1 hour charge
    const finalHours = billedHours < 1 ? 1 : billedHours;

    // 3. Calculate Final Price
    const totalCost = finalHours * parkingRecord.baseRate;

    // 4. Update Record
    parkingRecord.timeOut = timeOut;
    parkingRecord.duration = `${finalHours} hour(s)`;
    parkingRecord.finalPrice = totalCost;
    parkingRecord.status = "Departed";

    const updatedRecord = await parkingRecord.save();
    res.status(200).json(updatedRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE (Standard Edit if needed)
export const updateParking = async (req, res) => {
  try {
    const updated = await Parking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deleteParking = async (req, res) => {
  try {
    await Parking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};