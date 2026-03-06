// src/utils/notificationService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

export const sendNotification = async (title, message, source, targetRole = "all") => {
    try {
        const response = await fetch(`${API_URL}/api/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                message,
                source,
                targetRole
            }),
        });
        
        console.log("Notification Sent:", { title, targetRole }); 

        if (!response.ok) {
            console.error("Failed to send notification");
        }
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

export const fetchNotifications = async () => {
    try {
        const response = await fetch(`${API_URL}/api/notifications`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching notifications", error);
        return [];
    }
};

export const markNotificationAsRead = async (id) => {
    try {
        await fetch(`${API_URL}/api/notifications/${id}/read`, { method: "PUT" });
    } catch (error) { console.error(error); }
};

export const deleteNotification = async (id) => {
    try {
        await fetch(`${API_URL}/api/notifications/${id}`, { method: "DELETE" });
    } catch (error) { console.error(error); }
};