import Broadcast from '../models/Broadcast.js';

export const createBroadcast = async (req, res) => {
  try {
    const { title, message } = req.body;
    let attachment = null;

    if (req.file) {
      const contentType = req.file.contentType || req.file.mimetype;
      const isImage = contentType.startsWith('image/');
      
      attachment = {
        type: isImage ? 'image' : 'pdf',
        uri: `/api/files/${req.file.filename}`, 
        name: req.file.originalname
      };
    }

    const newBroadcast = new Broadcast({ title, message, attachment });
    const savedBroadcast = await newBroadcast.save();
    
    res.status(201).json({ success: true, data: savedBroadcast });
  } catch (error) {
    console.error("Error creating broadcast:", error);
    res.status(500).json({ success: false, message: 'Failed to create broadcast' });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    
    const formattedBroadcasts = broadcasts.map(b => {
      const formattedDate = new Date(b.createdAt).toLocaleString('en-US', { 
        month: 'short', day: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }).replace(',', ' •');

      return {
        id: b._id.toString(),
        title: b.title,
        message: b.message,
        source: b.source,
        date: formattedDate,
        attachment: b.attachment || null
      };
    });

    res.status(200).json(formattedBroadcasts);
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};