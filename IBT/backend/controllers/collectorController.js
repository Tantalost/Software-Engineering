import Collector from "../models/Collector.js";

const normalizeText = (value = "") =>
  String(value).trim().replace(/\s+/g, " ");

const normalizeContact = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("63")) return digits.slice(2, 12);
  if (digits.startsWith("0")) return digits.slice(1, 11);
  return digits.slice(0, 10);
};

const requiredDepartments = ["Bus", "Parking", "Terminal Fee", "Tenant"];

const normalizeDepartments = (value) => {
  const arr = Array.isArray(value) ? value : [];
  const cleaned = [...new Set(arr.map((v) => normalizeText(v)).filter(Boolean))];
  return cleaned.filter((d) => requiredDepartments.includes(d));
};

export const listCollectors = async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const department = normalizeText(req.query.department || "");
    const query = {};
    if (activeOnly) query.status = "Active";
    if (department && requiredDepartments.includes(department)) {
      query.assignedDepartment = { $in: [department] };
    }
    const collectors = await Collector.find(query).sort({
      lastName: 1,
      firstName: 1,
      middleName: 1,
    });
    return res.json(collectors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch collectors." });
  }
};

export const createCollector = async (req, res) => {
  try {
    const payload = {
      firstName: normalizeText(req.body.firstName),
      middleName: normalizeText(req.body.middleName || ""),
      lastName: normalizeText(req.body.lastName),
      suffix: normalizeText(req.body.suffix || ""),
      contactNumber: normalizeContact(req.body.contactNumber),
      assignedShift: normalizeText(req.body.assignedShift),
      assignedDepartment: normalizeDepartments(req.body.assignedDepartment),
      status: req.body.status === "Inactive" ? "Inactive" : "Active",
    };

    if (!payload.firstName || !payload.lastName || !payload.assignedShift) {
      return res.status(400).json({ message: "Missing required collector fields." });
    }

    if (!/^\d{10}$/.test(payload.contactNumber)) {
      return res
        .status(400)
        .json({ message: "Contact number must be exactly 10 digits." });
    }

    const existingCollector = await Collector.findOne({
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      suffix: payload.suffix,
      contactNumber: payload.contactNumber,
    });

    // If an inactive record already exists for this person+contact, revive it instead of failing.
    if (existingCollector) {
      if (existingCollector.status === "Inactive") {
        existingCollector.assignedShift = payload.assignedShift;
        existingCollector.assignedDepartment = payload.assignedDepartment;
        existingCollector.status = "Active";
        await existingCollector.save();
        return res.status(200).json({
          message: "Existing collector record reactivated.",
          collector: existingCollector,
        });
      }

      return res.status(409).json({ message: "Collector already exists." });
    }

    const collector = await Collector.create(payload);
    return res.status(201).json({ message: "Collector created.", collector });
  } catch (error) {
    if (error?.code === 11000) {
      // Defensive fallback for race conditions around unique index.
      const existingCollector = await Collector.findOne({
        firstName: normalizeText(req.body.firstName),
        middleName: normalizeText(req.body.middleName || ""),
        lastName: normalizeText(req.body.lastName),
        suffix: normalizeText(req.body.suffix || ""),
        contactNumber: normalizeContact(req.body.contactNumber),
      });

      if (existingCollector?.status === "Inactive") {
        existingCollector.assignedShift = normalizeText(req.body.assignedShift);
        existingCollector.assignedDepartment = normalizeDepartments(req.body.assignedDepartment);
        existingCollector.status = "Active";
        await existingCollector.save();
        return res.status(200).json({
          message: "Existing collector record reactivated.",
          collector: existingCollector,
        });
      }

      return res.status(409).json({ message: "Collector already exists." });
    }
    return res.status(500).json({ message: error.message || "Failed to create collector." });
  }
};

export const updateCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.firstName !== undefined) updates.firstName = normalizeText(req.body.firstName);
    if (req.body.middleName !== undefined) updates.middleName = normalizeText(req.body.middleName || "");
    if (req.body.lastName !== undefined) updates.lastName = normalizeText(req.body.lastName);
    if (req.body.suffix !== undefined) updates.suffix = normalizeText(req.body.suffix || "");
    if (req.body.assignedShift !== undefined) updates.assignedShift = normalizeText(req.body.assignedShift);
    if (req.body.assignedDepartment !== undefined) {
      updates.assignedDepartment = normalizeDepartments(req.body.assignedDepartment);
    }
    if (req.body.contactNumber !== undefined) {
      const normalized = normalizeContact(req.body.contactNumber);
      if (!/^\d{10}$/.test(normalized)) {
        return res
          .status(400)
          .json({ message: "Contact number must be exactly 10 digits." });
      }
      updates.contactNumber = normalized;
    }
    if (req.body.status !== undefined) {
      updates.status = req.body.status === "Inactive" ? "Inactive" : "Active";
    }

    const collector = await Collector.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!collector) {
      return res.status(404).json({ message: "Collector not found." });
    }

    return res.json({ message: "Collector updated.", collector });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Collector already exists." });
    }
    return res.status(500).json({ message: error.message || "Failed to update collector." });
  }
};

export const deleteCollector = async (req, res) => {
  try {
    const collector = await Collector.findByIdAndDelete(req.params.id);
    if (!collector) {
      return res.status(404).json({ message: "Collector not found." });
    }
    return res.json({ message: "Collector deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete collector." });
  }
};
