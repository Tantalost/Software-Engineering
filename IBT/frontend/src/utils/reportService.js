export const submitPageReport = async (type, pageData, author = "Admin") => {
  try {
    const response = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type, // e.g., "Bus Module"
        data: pageData, // The entire state object of that page
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