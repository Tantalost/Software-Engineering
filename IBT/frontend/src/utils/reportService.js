export const submitPageReport = async (type, pageData, author = "Admin") => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000";
    const response = await fetch(`${apiUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type, 
        data: pageData,
        author: author,
        status: "Submitted"
      }),
    });

    if (!response.ok) throw new Error('Failed to submit report');
    return await response.json();
  } catch (error) {
    console.error("Report submission failed:", error);
    throw error;
  }
};