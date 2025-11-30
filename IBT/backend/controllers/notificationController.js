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
            source: n.source
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