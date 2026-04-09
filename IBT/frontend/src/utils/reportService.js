export const submitPageReport = async (
  type,
  pageData,
  author = "Admin",
  options = {},
) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000";
    const authorEmail = localStorage.getItem("authEmail") || "";
    const response = await fetch(`${apiUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type, 
        data: pageData,
        payload: options.payload || pageData,
        reportType: options.reportType,
        author: author,
        authorEmail,
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