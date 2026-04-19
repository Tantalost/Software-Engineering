import Company from "../models/Company.js";
import { normalizeCompanyForResponse, resolveBusTypeId } from "../utils/busTypeCompat.js";

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

      for (const bus of buses) {
        const resolvedBusTypeId = await resolveBusTypeId(bus?.busType);
        if (!resolvedBusTypeId) {
          return res.status(400).json({
            message: `Invalid bus type for bus ${bus?.plateNumber || ""}.`,
          });
        }

        resolvedBuses.push({
          ...bus,
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