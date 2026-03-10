import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const notes = await Notification.find().sort({ createdAt: -1 });
        const formatted = notes.map(n => ({
            id: n._id,
            title: n.title,
            message: n.message,
            date: n.date,
            read: n.read,
            source: n.source,
            targetRole: n.targetRole 
        }));
        res.status(200).json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createNotification = async (req, res) => {
    try {
        const newNote = new Notification({
            title: req.body.title,
            message: req.body.message,
            source: req.body.source,
            targetRole: req.body.targetRole || "all", 
            date: new Date().toISOString().split('T')[0]
        });
        const saved = await newNote.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const broadcastNotification = async (req, res) => {
    try {
        const { title, message, targetGroup, recipientIds, scheduleTime } = req.body;
        let attachments = [];

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

        // For now, create individual notifications for each recipient
        // In future, could optimize with a broadcast system
        const notifications = recipientIds.map(recipientId => ({
            title,
            message,
            source: "Tenant Lease",
            targetRole: "tenant",
            targetUserId: recipientId,
            attachments,
            date: scheduleTime ? new Date(scheduleTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        await Notification.insertMany(notifications);
        
        res.status(201).json({ success: true, message: "Broadcast sent successfully" });
    } catch (error) {
        console.error("Error broadcasting notification:", error);
        res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
    }
};