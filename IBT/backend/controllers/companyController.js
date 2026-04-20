import Company from "../models/Company.js";
import { normalizeCompanyForResponse, resolveBusTypeId } from "../utils/busTypeCompat.js";

const MAX_BUS_PLATE_LENGTH = 20;
const MAX_ROUTE_FIELD_LENGTH = 80;
const MAX_BUS_SCHEDULE_SLOTS = 12;

const normalizeScheduleTimes = (bus = {}) => {
  const fromArray = Array.isArray(bus.scheduleTimes)
    ? bus.scheduleTimes
    : [];
  const fromLegacy = String(bus.scheduleTime || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const merged = [...fromArray, ...fromLegacy]
    .map((t) => String(t).trim())
    .filter(Boolean);

  return [...new Set(merged)];
};

// @desc    Get all companies and their buses
// @route   GET /api/companies
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("buses.busType", "name")
      .sort({ name: 1 });

    res.status(200).json(companies.map(normalizeCompanyForResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new company
// @route   POST /api/companies
export const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    const companyExists = await Company.findOne({ name });
    
    if (companyExists) {
      return res.status(400).json({ message: "Company already exists" });
    }

    const company = await Company.create({
      name,
      buses: []
    });

    const populated = await Company.findById(company._id).populate("buses.busType", "name");
    res.status(201).json(normalizeCompanyForResponse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update company (Used for adding/removing buses)
// @route   PUT /api/companies/:id
export const updateCompany = async (req, res) => {
  try {
    const { name, buses } = req.body;
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.name = name || company.name;

    if (Array.isArray(buses)) {
      const resolvedBuses = [];
      const seenPlateSchedule = new Set();

      for (const bus of buses) {
        const resolvedBusTypeId = await resolveBusTypeId(bus?.busType);
        if (!resolvedBusTypeId) {
          return res.status(400).json({
            message: `Invalid bus type for bus ${bus?.plateNumber || ""}.`,
          });
        }

        const plate = String(bus?.plateNumber || "").trim();
        const route = String(bus?.route || "").trim();
        const scheduleTimes = normalizeScheduleTimes(bus);

        if (!plate) {
          return res.status(400).json({
            message: "Bus number is required.",
          });
        }

        if (plate.length > MAX_BUS_PLATE_LENGTH) {
          return res.status(400).json({
            message: `Bus number must be ${MAX_BUS_PLATE_LENGTH} characters or fewer.`,
          });
        }

        if (!route) {
          return res.status(400).json({
            message: `Route is required for bus ${plate}.`,
          });
        }

        if (route.length > MAX_ROUTE_FIELD_LENGTH * 2 + 3) {
          return res.status(400).json({
            message: `Route is too long for bus ${plate}.`,
          });
        }

        if (scheduleTimes.length === 0) {
          return res.status(400).json({
            message: `At least one arrival time is required for bus ${plate}.`,
          });
        }

        if (scheduleTimes.length > MAX_BUS_SCHEDULE_SLOTS) {
          return res.status(400).json({
            message: `Only up to ${MAX_BUS_SCHEDULE_SLOTS} arrival times are allowed per bus.`,
          });
        }

        const normalizedPlate = plate.toUpperCase();
        for (const time of scheduleTimes) {
          const key = `${normalizedPlate}|||${String(time).trim().toUpperCase()}`;
          if (seenPlateSchedule.has(key)) {
            return res.status(400).json({
              message: `Bus ${plate} with arrival time ${time} already exists. Use a different arrival time.`,
            });
          }
          seenPlateSchedule.add(key);
        }

        resolvedBuses.push({
          ...bus,
          plateNumber: plate,
          route,
          scheduleTimes,
          scheduleTime: scheduleTimes.join(", "),
          busType: resolvedBusTypeId,
        });
      }

      company.buses = resolvedBuses;
    }

    const updatedCompany = await company.save();
    const populated = await Company.findById(updatedCompany._id).populate("buses.busType", "name");
    res.status(200).json(normalizeCompanyForResponse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await company.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};