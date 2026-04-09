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

const REPORT_TYPE_BY_LABEL = {
  "Bus Trips": "Bus",
  Bus: "Bus",
  "Terminal Fees": "TerminalFee",
  "Terminal Fee": "TerminalFee",
  TerminalFee: "TerminalFee",
  Parking: "Parking",
  Tenant: "Tenant",
  "Tenant Lease": "Tenant",
  LostAndFound: "LostAndFound",
  "Lost & Found": "LostAndFound",
};

const normalizeReportType = (reportType, typeLabel) => {
  if (reportType && REPORT_TYPE_BY_LABEL[reportType]) {
    return REPORT_TYPE_BY_LABEL[reportType];
  }
  if (typeLabel && REPORT_TYPE_BY_LABEL[typeLabel]) {
    return REPORT_TYPE_BY_LABEL[typeLabel];
  }
  return "Bus";
};

// CREATE
export const createReport = async (req, res) => {
  try {
    const {
      type,
      reportType,
      data,
      payload,
      author,
      authorEmail,
      status,
    } = req.body;
    const effectivePayload = payload ?? data ?? {};
    const resolvedType = type || "General";
    const resolvedReportType = normalizeReportType(reportType, resolvedType);
    const now = new Date();
    const submittedAdminId = effectivePayload?.adminId || null;

    let admin = null;
    let normalizedData = {
      ...(effectivePayload || {}),
      reportType: resolvedReportType,
      submittedAtServer: now.toISOString(),
      submittedByEmail: authorEmail || null,
    };

    if (resolvedReportType === "Bus") {
      if (submittedAdminId) {
        admin = await Admin.findById(submittedAdminId);
      } else if (authorEmail) {
        admin = await Admin.findOne({ email: String(authorEmail).toLowerCase() });
      }

      const assignedShift = admin?.assignedShift || null;
      const actualShiftAtSubmission = toShiftLabel(now.getHours());
      const { start: shiftStart } = getShiftWindowBounds(assignedShift, now);
      const sessionStartedAtRaw = effectivePayload?.sessionStartedAt;
      const parsedSessionStart = sessionStartedAtRaw
        ? new Date(sessionStartedAtRaw)
        : null;
      const hasValidSessionStart =
        parsedSessionStart && !Number.isNaN(parsedSessionStart.getTime());
      const actionWindowStart = hasValidSessionStart ? parsedSessionStart : shiftStart;
      const actionWindowEnd = now;

      let busActionRecords = [];
      if (admin?._id) {
        busActionRecords = await BusTrip.find({
          $or: [
            {
              arrivalAdminId: admin._id,
              $or: [
                { arrivalLoggedAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
                { updatedAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
                { createdAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
              ],
            },
            {
              departureAdminId: admin._id,
              $or: [
                { departureLoggedAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
                { updatedAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
                { createdAt: { $gte: actionWindowStart, $lte: actionWindowEnd } },
              ],
            },
          ],
        })
          .select(
            "templateNo company route status arrivalAdminId departureAdminId arrivalLoggedAt departureLoggedAt time departureTime date",
          )
          .lean();
      }

      const completedTransactions = Array.isArray(effectivePayload?.completedTransactions)
        ? effectivePayload.completedTransactions
        : [];
      const missedTransactions = Array.isArray(effectivePayload?.missedTransactions)
        ? effectivePayload.missedTransactions
        : [];

      const finalizedActions =
        completedTransactions.length > 0 || missedTransactions.length > 0
          ? [
              ...completedTransactions.map((row) => ({
                ...row,
                category: "completed",
              })),
              ...missedTransactions.map((row) => ({
                ...row,
                category: "missed",
                status: "Not Arrive",
              })),
            ]
          : busActionRecords;

      normalizedData = {
        screen: effectivePayload?.screen || "",
        collectorId: effectivePayload?.collectorId || null,
        collectorName: effectivePayload?.collectorName || "",
        adminId: admin?._id || submittedAdminId || null,
        assignedShift,
        shift: assignedShift,
        submittedAtServer: now.toISOString(),
        submittedAtShiftWindow: actualShiftAtSubmission,
        submittedLate: assignedShift
          ? assignedShift !== actualShiftAtSubmission
          : !!effectivePayload?.submittedLate,
        submittedByEmail: authorEmail || null,
        actionWindow: {
          from: actionWindowStart.toISOString(),
          to: actionWindowEnd.toISOString(),
        },
        // Backward-compatible shape expected by Reports page renderer/exporters.
        data: finalizedActions,
        statistics: {
          totalActions: finalizedActions.length,
          completedCount:
            completedTransactions.length > 0 || missedTransactions.length > 0
              ? completedTransactions.length
              : finalizedActions.filter((r) => r.status === "Departed").length,
          missedCount:
            completedTransactions.length > 0 || missedTransactions.length > 0
              ? missedTransactions.length
              : 0,
          arrivalsLogged: finalizedActions.filter((r) => r.arrivalAdminId).length,
          departuresLogged: finalizedActions.filter((r) => r.departureAdminId).length,
          departedNow: finalizedActions.filter((r) => r.status === "Departed").length,
        },
        busActions: finalizedActions,
        completedTransactions,
        missedTransactions,
      };
    }
    
    const newReport = new Report({
      type: resolvedType,
      reportType: resolvedReportType,
      data: normalizedData,
      payload: effectivePayload,
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