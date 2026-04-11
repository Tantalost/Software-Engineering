import Broadcast from '../models/Broadcast.js';
import User from '../models/User.js'; 
import sendPushNotification from '../utils/sendPushNotification.js'; 

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

export const createBroadcast = async (req, res) => {
  try {
    const { title, message, scheduledFor, targetGroup, dueDate, authorRole } = req.body;
    let attachments = [];

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const dayOfMonth = dueDateObj.getDate();
      
      if (dayOfMonth < 1 || dayOfMonth > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Due date must be within the first 5 days of the month' 
        });
      }
    }

    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => {
        const contentType = file.contentType || file.mimetype;
        const isImage = contentType.startsWith('image/');
        
        return {
          type: isImage ? 'image' : 'video',
          uri: `/api/files/${file.filename}`, 
          name: file.originalname
        };
      });
    }

   const newBroadcast = new Broadcast({ 
      title, 
      message, 
      targetGroup: targetGroup || 'All',
      dueDate: dueDate ? new Date(dueDate) : null,
      attachments,
   
      authorRole: authorRole || 'superadmin',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : Date.now()
    });

    const savedBroadcast = await newBroadcast.save();
    
    const isFuture = scheduledFor && new Date(scheduledFor) > new Date();
    if (!isFuture) {
      broadcastNotification(
        `📢 Announcement: ${title}`,
        message,
        { route: 'index' } 
      );
    }

    res.status(201).json({ success: true, data: savedBroadcast });
  } catch (error) {
    console.error("Error creating broadcast:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create broadcast' });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const now = new Date();
    
    const broadcasts = await Broadcast.find({ scheduledFor: { $lte: now } })
                                      .sort({ scheduledFor: -1 }); 
    
    const formattedBroadcasts = broadcasts.map(b => {
      const formattedDate = new Date(b.scheduledFor || b.createdAt).toLocaleString('en-US', { 
        month: 'short', day: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }).replace(',', ' •');

      return {
        id: b._id.toString(),
        title: b.title,
        message: b.message,
        source: b.source,
        date: formattedDate,
        attachments: b.attachments || [] 
      };
    });

    res.status(200).json(formattedBroadcasts);
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};

export const getAdminBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ scheduledFor: -1 });
    
    const formattedBroadcasts = broadcasts.map(b => {
      const formattedDate = new Date(b.scheduledFor || b.createdAt).toLocaleString('en-US', { 
        month: 'short', day: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }).replace(',', ' •');

      const isScheduled = new Date(b.scheduledFor) > new Date();

      return {
        id: b._id.toString(),
        title: b.title,
        message: b.message,
        status: isScheduled ? 'Scheduled' : 'Posted',
        date: formattedDate,
        attachments: b.attachments || [],
        authorRole: b.authorRole,
      };
    });

    res.status(200).json(formattedBroadcasts);
  } catch (error) {
    console.error("Error fetching admin broadcasts:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};

export const deleteBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
    if (!broadcast) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }
    res.status(200).json({ success: true, message: 'Broadcast deleted successfully' });
  } catch (error) {
    console.error("Error deleting broadcast:", error);
    res.status(500).json({ success: false, message: 'Failed to delete broadcast' });
  }
};

export const updateBroadcast = async (req, res) => {
  try {
    const { title, message, targetGroup } = req.body;
    let updateData = { title, message, targetGroup: targetGroup || 'All' };

    if (req.files && req.files.length > 0) {
      updateData.attachments = req.files.map(file => {
        const isImage = (file.contentType || file.mimetype).startsWith('image/');
        return {
          type: isImage ? 'image' : 'video',
          uri: `/api/files/${file.filename}`, 
          name: file.originalname
        };
      });
    }

    const updatedBroadcast = await Broadcast.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedBroadcast) return res.status(404).json({ success: false, message: 'Broadcast not found' });
    res.status(200).json({ success: true, data: updatedBroadcast });
  } catch (error) {
    console.error("Error updating broadcast:", error);
    res.status(500).json({ success: false, message: 'Failed to update broadcast' });
  }
};