const API_URL = "http://localhost:3000/api/notifications";

export const sendNotification = async (title, message, source = "System") => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, message, source }),
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to send notification:", error);
        return false;
    }
};

export const fetchNotifications = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const markNotificationAsRead = async (id) => {
    try {
        await fetch(`${API_URL}/${id}/read`, { method: "PUT" });
    } catch (error) {
        console.error("Failed to mark read:", error);
    }
};

export const deleteNotification = async (id) => {
    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (error) {
        console.error("Failed to delete:", error);
    }
};