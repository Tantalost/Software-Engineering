import Report from '../models/Report.js';
import Admin from '../models/Admin.js';
import BusTrip from '../models/BusTrips.js';

const toShiftLabel = (hour) => {
  if (hour >= 0 && hour < 6) return "00-06";
  if (hour >= 6 && hour < 12) return "06-12";
  if (hour >= 12 && hour < 18) return "12-18";
  return "18-24";
};

const getShiftWindowBounds = (assignedShift, now = new Date()) => {
  if (!assignedShift || !/^\d{2}-\d{2}$/.test(assignedShift)) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const [startHour, endHourRaw] = assignedShift.split('-').map((v) => parseInt(v, 10));
  const endHour = endHourRaw === 24 ? 0 : endHourRaw;
  const overnight = startHour >= endHour;

  const start = new Date(now);
  const end = new Date(now);
  start.setMinutes(0, 0, 0);
  end.setMinutes(59, 59, 999);

  if (!overnight) {
    start.setHours(startHour);
    end.setHours(endHourRaw === 24 ? 23 : endHour);
    return { start, end };
  }

  if (now.getHours() < endHour) {
    start.setDate(start.getDate() - 1);
    start.setHours(startHour);
    end.setHours(endHour);
  } else {
    start.setHours(startHour);
    end.setDate(end.getDate() + 1);
    end.setHours(endHour);
  }
  return { start, end };
};

// CREATE
export const createReport = async (req, res) => {
  try {
    const { type, data, author, authorEmail, status } = req.body;
    const now = new Date();

    let admin = null;
    if (authorEmail) {
      admin = await Admin.findOne({ email: String(authorEmail).toLowerCase() });
    }

    const assignedShift = admin?.assignedShift || null;
    const actualShiftAtSubmission = toShiftLabel(now.getHours());
    const { start: shiftStart, end: shiftEnd } = getShiftWindowBounds(assignedShift, now);

    let busActionRecords = [];
    if (admin?._id) {
      busActionRecords = await BusTrip.find({
        $or: [
          {
            arrivalAdminId: admin._id,
            arrivalLoggedAt: { $gte: shiftStart, $lte: shiftEnd },
          },
          {
            departureAdminId: admin._id,
            departureLoggedAt: { $gte: shiftStart, $lte: shiftEnd },
          },
        ],
      })
        .select(
          "templateNo company route status arrivalAdminId departureAdminId arrivalLoggedAt departureLoggedAt time departureTime date",
        )
        .lean();
    }

    const normalizedData = {
      ...(data || {}),
      assignedShift,
      shift: assignedShift,
      submittedAtServer: now.toISOString(),
      submittedAtShiftWindow: actualShiftAtSubmission,
      submittedLate: assignedShift ? assignedShift !== actualShiftAtSubmission : !!data?.submittedLate,
      submittedByEmail: authorEmail || null,
      actionWindow: {
        from: shiftStart.toISOString(),
        to: shiftEnd.toISOString(),
      },
      busActions: busActionRecords,
    };
    
    const newReport = new Report({
      type,
      data: normalizedData,
      author: author || "System User",
      status: status || "Submitted"
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ message: "Error creating report", error: error.message });
  }
};

// GET ALL
export const getAllReports = async (req, res) => {
  try {
    // Filter out archived reports using the $ne: true trick
    const reports = await Report.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

// --- SOFT DELETE FUNCTIONS (Archive & Restore) ---

export const archiveReport = async (req, res) => {
  try {
    const archived = await Report.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!archived) return res.status(404).json({ message: "Report not found" });
    res.status(200).json({ message: "Report archived successfully", report: archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreReport = async (req, res) => {
  try {
    const restored = await Report.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    if (!restored) return res.status(404).json({ message: "Report not found" });
    res.status(200).json({ message: "Report restored successfully", report: restored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchivedReports = async (req, res) => {
  try {
    const reports = await Report.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET SPECIFIC REPORT
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Error fetching report details", error: error.message });
  }
};

// HARD DELETE (Superadmin Nuke)
export const deleteReport = async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Report permanently deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};