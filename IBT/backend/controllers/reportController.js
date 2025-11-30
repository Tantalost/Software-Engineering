import Report from '../models/Report.js';

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { type, data, author, status } = req.body;
    
    const newReport = new Report({
      type,
      data,
      author: author || "System User",
      status: status || "Submitted"
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ message: "Error creating report", error: error.message });
  }
};

// Get all reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

// Get single report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Error fetching report details", error: error.message });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Report deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};