import BusTrip from '../models/BusRoute.js'; 

export const getBusRoutes = async (req, res) => {
  try {
    const trips = await BusTrip.find({ 
      $or: [
        { isArchived: false },
        { isArchived: { $exists: false } }
      ]
    }).sort({ date: 1, time: 1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};