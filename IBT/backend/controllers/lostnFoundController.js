import LostFound from '../models/LostNFound.js';

export const getLostItems = async (req, res) => {
  try {
    const items = await LostFound.find({}).sort({ dateTime: -1 });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};