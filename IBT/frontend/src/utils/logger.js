const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`; 

export const logActivity = async (user, action, details, module = "General") => {
  try {
    await fetch(`${API_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        action,
        details,
        module
      }),
    });
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};