import mongoose from "mongoose";
import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";
import Settings from "../models/Settings.js";

import User from "../models/User.js"; 
import sendPushNotification from "../utils/sendPushNotification.js";

const normalizeFeeBreakdown = (rawBreakdown = {}, tenantType = "Permanent") => {
  const isNightMarket = tenantType === "Night Market";
  const electricity = isNightMarket ? 0 : Number(rawBreakdown.electricity || 0);
  const otherAmount = Number(rawBreakdown.otherAmount || 0);

  return {
    garbageFee: 0,
    permitFee: 0,
    businessTaxes: 0,
    water: 0,
    electricity,
    otherAmount,
    otherSpecify: rawBreakdown.otherSpecify || ""
  };
};

const CONTRACT_TEMPLATES_KEY = "tenantContractTemplates";
const DEFAULT_CONTRACT_TEMPLATE_KEY = "tenantDefaultContractTemplateId";

const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toNonNegativeInt = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "on"].includes(normalized);
  }
  return false;
};

const normalizeContractType = (value, fallback = "RENEWAL") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "INITIAL") return "INITIAL";
  if (normalized === "RENEWAL") return "RENEWAL";
  return fallback;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const NIGHT_MARKET_BASE_PRICE_KEY = "defaultNightPrice";
const NIGHT_MARKET_WEEKLY_RENT_KEY = "nightMarketWeeklyRent";

const getSlotCount = (slotNo) => {
  if (!slotNo) return 1;
  const count = String(slotNo)
    .split(",")
    .map((slot) => slot.trim())
    .filter(Boolean).length;
  return Math.max(1, count);
};

const getNightMarketPricing = async () => {
  const [baseSetting, weeklySetting] = await Promise.all([
    Settings.findOne({ key: NIGHT_MARKET_BASE_PRICE_KEY }),
    Settings.findOne({ key: NIGHT_MARKET_WEEKLY_RENT_KEY }),
  ]);

  const basePrice = baseSetting ? Number(baseSetting.value) : 150;
  const fallbackWeeklyRent = Math.max(0, basePrice) * 7;
  const weeklyRent = weeklySetting ? Number(weeklySetting.value) : fallbackWeeklyRent;

  return {
    basePrice: Number.isFinite(basePrice) ? Math.max(0, basePrice) : 150,
    weeklyRent: Number.isFinite(weeklyRent) ? Math.max(0, weeklyRent) : fallbackWeeklyRent,
  };
};

const withDayInMonth = (baseDate, targetDay) => {
  const copy = new Date(baseDate);
  const safeDay = Math.max(1, Number(targetDay) || 1);
  const daysInMonth = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(safeDay, daysInMonth));
  return copy;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysUntil = (targetDate, fromDate = new Date()) => {
  const diff = startOfDay(targetDate).getTime() - startOfDay(fromDate).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const hasOutstandingOverdueBalance = (tenant) => {
  const status = String(tenant?.status || "").toLowerCase();
  const charge = Number(tenant?.chargeAmount || 0);
  const interest = Number(tenant?.interestAmount || 0);
  const overdueCycleCount = Number(tenant?.overdueCycleCount || 0);

  return status === "overdue" || charge > 0 || interest > 0 || overdueCycleCount >= 2;
};

const isAutoPausedForNonPayment = (tenant) => {
  return Boolean(tenant?.isOperationPaused)
    && String(tenant?.operationPauseReason || "").toUpperCase() === "NON_PAYMENT_2_MONTHS";
};

const calculateDurationMonths = (startDate, endDate) => {
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (endDate.getDate() >= startDate.getDate()) {
    months += 1;
  }

  return Math.max(months, 1);
};

const splitDuration = (durationMonths) => ({
  years: Math.floor(durationMonths / 12),
  months: durationMonths % 12,
});

const deriveContractTiming = ({ startDate, endDate, durationYears, durationMonths, durationTotalMonths }) => {
  const parsedStart = toValidDate(startDate);
  if (!parsedStart) {
    throw new Error("A valid contract start date is required.");
  }

  let totalMonths = toNonNegativeInt(durationTotalMonths);
  if (totalMonths === 0) {
    totalMonths = (toNonNegativeInt(durationYears) * 12) + toNonNegativeInt(durationMonths);
  }

  let parsedEnd = toValidDate(endDate);

  if (!parsedEnd && totalMonths > 0) {
    parsedEnd = addMonths(parsedStart, totalMonths);
  }

  if (!parsedEnd) {
    throw new Error("Provide either a valid end date or a duration in months/years.");
  }

  if (parsedEnd <= parsedStart) {
    throw new Error("Contract end date must be after the contract start date.");
  }

  if (totalMonths === 0) {
    totalMonths = calculateDurationMonths(parsedStart, parsedEnd);
  }

  return {
    startDate: parsedStart,
    endDate: parsedEnd,
    durationMonths: totalMonths,
    duration: splitDuration(totalMonths),
  };
};

const ensureSingleActiveContract = (tenant, targetContractId) => {
  tenant.contracts.forEach((contract) => {
    if (String(contract._id) === String(targetContractId)) {
      contract.status = "active";
      return;
    }

    if (contract.status === "active") {
      contract.status = "superseded";
    }
  });
};

const syncLegacyFieldsFromActiveContract = (tenant, activeContract) => {
  if (!activeContract) return;

  tenant.activeContractId = activeContract._id;
  tenant.StartDateTime = activeContract.startDate;
  tenant.DueDateTime = activeContract.endDate;

  tenant.documents = tenant.documents || {};
  if (activeContract.documentUrl) {
    tenant.documents.contract = activeContract.documentUrl;
  }
};

const normalizeContractTemplates = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && item._id);
};

const fetchContractTemplateState = async () => {
  const [templatesSetting, defaultSetting] = await Promise.all([
    Settings.findOne({ key: CONTRACT_TEMPLATES_KEY }),
    Settings.findOne({ key: DEFAULT_CONTRACT_TEMPLATE_KEY }),
  ]);

  const templates = normalizeContractTemplates(templatesSetting?.value);
  const defaultTemplateId = typeof defaultSetting?.value === "string" ? defaultSetting.value : "";

  return {
    templates,
    defaultTemplateId,
    templatesSetting,
    defaultSetting,
  };
};

const buildTemplateDuration = ({ durationYears, durationMonths, durationTotalMonths }) => {
  let totalMonths = toNonNegativeInt(durationTotalMonths);
  if (totalMonths === 0) {
    totalMonths = (toNonNegativeInt(durationYears) * 12) + toNonNegativeInt(durationMonths);
  }

  if (totalMonths <= 0) {
    throw new Error("Template duration is required (months/years).");
  }

  return {
    durationMonths: totalMonths,
    duration: splitDuration(totalMonths),
  };
};

export const getTenants = async (req, res) => {
  try {
    const query = req.query.all === 'true' ? {} : { isArchived: { $ne: true }, isDeleted: { $ne: true } };
    const tenants = await Tenant.find(query).sort({ createdAt: -1 });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitTenantsForShift = async (req, res) => {
  try {
    const { sessionStartedAt, reportId } = req.body;
    if (!sessionStartedAt) {
      return res.status(400).json({ message: "sessionStartedAt is required." });
    }

    const shiftStart = new Date(sessionStartedAt);
    if (Number.isNaN(shiftStart.getTime())) {
      return res.status(400).json({ message: "Invalid sessionStartedAt." });
    }

    const now = new Date();
    const candidates = await Tenant.find({
      isArchived: { $ne: true },
      isDeleted: { $ne: true },
      $or: [
        { createdAt: { $gte: shiftStart, $lte: now } },
        { updatedAt: { $gte: shiftStart, $lte: now } },
      ],
    }).select("_id submittedAt");

    const pendingIds = candidates
      .filter((tenant) => {
        if (!tenant.submittedAt) return true;
        const submittedAt = new Date(tenant.submittedAt);
        return Number.isNaN(submittedAt.getTime()) || submittedAt < shiftStart;
      })
      .map((tenant) => tenant._id);

    if (pendingIds.length === 0) {
      return res.status(200).json({
        message: "No tenant records pending submission for this shift.",
        matchedCount: 0,
        modifiedCount: 0,
        reportId: reportId || null,
      });
    }

    const updatePayload = {
      submitted: true,
      submittedAt: now,
    };
    if (reportId) {
      updatePayload.reportId = reportId;
    }

    const result = await Tenant.updateMany(
      { _id: { $in: pendingIds } },
      { $set: updatePayload },
    );

    return res.status(200).json({
      message: "Shift tenant records marked as submitted.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      reportId: reportId || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit tenant shift records.", error: error.message });
  }
};

export const sendTenantEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Email, subject, and message are required." });
    }

  
    await sendEmail({
      email: email,
      subject: subject,
      message: message
    });

    res.status(200).json({ success: true, message: "Email sent successfully to tenant." });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
};

export const archiveTenant = async (req, res) => {
  try {
    const archived = await Tenant.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!archived) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json({ message: "Tenant archived successfully", tenant: archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreTenant = async (req, res) => {
  try {
    const restored = await Tenant.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    if (!restored) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json({ message: "Tenant restored successfully", tenant: restored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchivedTenants = async (req, res) => {
  try {
    const archived = await Tenant.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(archived);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    await Tenant.findByIdAndUpdate(req.params.id, { isDeleted: true, isArchived: true });
    res.status(200).json({ message: "Tenant permanently deleted " });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTenantContracts = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select(
      "tenantName tenantType slotNo contracts activeContractId StartDateTime DueDateTime documents"
    );

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.tenantType === "Night Market") {
      return res.status(200).json({
        tenantId: tenant._id,
        tenantName: tenant.tenantName,
        slotNo: tenant.slotNo,
        activeContractId: null,
        contracts: [],
        legacy: {
          StartDateTime: tenant.StartDateTime,
          DueDateTime: tenant.DueDateTime,
          contract: "",
        },
      });
    }

    const sortedContracts = [...(tenant.contracts || [])].sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    return res.status(200).json({
      tenantId: tenant._id,
      tenantName: tenant.tenantName,
      slotNo: tenant.slotNo,
      activeContractId: tenant.activeContractId,
      contracts: sortedContracts,
      legacy: {
        StartDateTime: tenant.StartDateTime,
        DueDateTime: tenant.DueDateTime,
        contract: tenant.documents?.contract || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const addTenantContract = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use contract lifecycle." });
    }

    const timing = deriveContractTiming({
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      durationYears: req.body.durationYears,
      durationMonths: req.body.durationMonths,
      durationTotalMonths: req.body.durationTotalMonths,
    });

    const shouldActivate =
      toBoolean(req.body.makeActive) ||
      String(req.body.status || "").toLowerCase() === "active" ||
      !tenant.activeContractId ||
      !Array.isArray(tenant.contracts) ||
      tenant.contracts.length === 0;

    const newContract = {
      contractType: normalizeContractType(req.body.contractType, "RENEWAL"),
      startDate: timing.startDate,
      endDate: timing.endDate,
      durationMonths: timing.durationMonths,
      duration: timing.duration,
      documentUrl: req.file?.filename || req.body.documentUrl || "",
      status: shouldActivate ? "active" : (req.body.status || "inactive"),
      source: "admin",
      assignedAt: new Date(),
      notes: req.body.notes || "",
    };

    tenant.contracts.push(newContract);
    const createdContract = tenant.contracts[tenant.contracts.length - 1];

    if (shouldActivate) {
      ensureSingleActiveContract(tenant, createdContract._id);
      syncLegacyFieldsFromActiveContract(tenant, createdContract);
    }

    await tenant.save();

    return res.status(201).json({
      message: "Contract added successfully.",
      tenant,
      contract: createdContract,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateTenantContract = async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use contract lifecycle." });
    }

    const contract = tenant.contracts.id(contractId);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const hasTimingUpdate =
      req.body.startDate !== undefined ||
      req.body.endDate !== undefined ||
      req.body.durationYears !== undefined ||
      req.body.durationMonths !== undefined ||
      req.body.durationTotalMonths !== undefined;

    if (hasTimingUpdate) {
      const timing = deriveContractTiming({
        startDate: req.body.startDate || contract.startDate,
        endDate: req.body.endDate || contract.endDate,
        durationYears: req.body.durationYears,
        durationMonths: req.body.durationMonths,
        durationTotalMonths: req.body.durationTotalMonths,
      });

      contract.startDate = timing.startDate;
      contract.endDate = timing.endDate;
      contract.durationMonths = timing.durationMonths;
      contract.duration = timing.duration;
    }

    if (req.body.contractType) {
      contract.contractType = normalizeContractType(req.body.contractType, "RENEWAL");
    }

    if (req.body.notes !== undefined) {
      contract.notes = req.body.notes;
    }

    if (req.file?.filename) {
      contract.documentUrl = req.file.filename;
    } else if (req.body.documentUrl) {
      contract.documentUrl = req.body.documentUrl;
    }

    const wantsActive =
      toBoolean(req.body.makeActive) ||
      String(req.body.status || "").toLowerCase() === "active";

    if (wantsActive) {
      ensureSingleActiveContract(tenant, contract._id);
      syncLegacyFieldsFromActiveContract(tenant, contract);
    } else if (req.body.status) {
      const isCurrentActive = String(tenant.activeContractId || "") === String(contract._id);
      if (isCurrentActive && req.body.status !== "active") {
        return res.status(400).json({ error: "Cannot deactivate the active contract. Activate another contract first." });
      }
      contract.status = req.body.status;
    }

    const stillActive = String(tenant.activeContractId || "") === String(contract._id) || contract.status === "active";
    if (stillActive) {
      syncLegacyFieldsFromActiveContract(tenant, contract);
    }

    await tenant.save();

    return res.status(200).json({
      message: "Contract updated successfully.",
      tenant,
      contract,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const activateTenantContract = async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use contract lifecycle." });
    }

    const contract = tenant.contracts.id(contractId);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    ensureSingleActiveContract(tenant, contract._id);
    syncLegacyFieldsFromActiveContract(tenant, contract);

    await tenant.save();

    return res.status(200).json({
      message: "Contract activated successfully.",
      tenant,
      contract,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteTenantContract = async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use contract lifecycle." });
    }

    if (!Array.isArray(tenant.contracts) || tenant.contracts.length <= 1) {
      return res.status(400).json({ error: "Cannot delete the last remaining contract." });
    }

    const contract = tenant.contracts.id(contractId);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const deletingActive =
      String(tenant.activeContractId || "") === String(contract._id) ||
      contract.status === "active";

    tenant.contracts.pull(contract._id);

    if (deletingActive) {
      const sortedRemaining = [...tenant.contracts].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      );
      const replacement = sortedRemaining[0];

      if (!replacement) {
        return res.status(400).json({ error: "Cannot remove active contract without a replacement." });
      }

      ensureSingleActiveContract(tenant, replacement._id);
      syncLegacyFieldsFromActiveContract(tenant, replacement);
    }

    await tenant.save();

    return res.status(200).json({
      message: "Contract deleted successfully.",
      tenant,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getContractTemplates = async (req, res) => {
  try {
    const { templates, defaultTemplateId } = await fetchContractTemplateState();

    return res.status(200).json({
      templates: [...templates].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      defaultTemplateId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createContractTemplate = async (req, res) => {
  try {
    const { templates, templatesSetting } = await fetchContractTemplateState();
    const timing = buildTemplateDuration({
      durationYears: req.body.durationYears,
      durationMonths: req.body.durationMonths,
      durationTotalMonths: req.body.durationTotalMonths,
    });

    const now = new Date();
    const newTemplate = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: req.body.name || "",
      contractType: normalizeContractType(req.body.contractType, "INITIAL"),
      durationMonths: timing.durationMonths,
      duration: timing.duration,
      documentUrl: req.file?.filename || req.body.documentUrl || "",
      notes: req.body.notes || "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const nextTemplates = [...templates, newTemplate];

    if (templatesSetting) {
      templatesSetting.value = nextTemplates;
      await templatesSetting.save();
    } else {
      await Settings.create({ key: CONTRACT_TEMPLATES_KEY, value: nextTemplates });
    }

    return res.status(201).json({
      message: "Contract template created.",
      template: newTemplate,
      templates: nextTemplates,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateContractTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { templates, templatesSetting } = await fetchContractTemplateState();

    const index = templates.findIndex((template) => String(template._id) === String(templateId));
    if (index === -1) {
      return res.status(404).json({ error: "Template not found." });
    }

    const current = templates[index];

    let nextDurationMonths = Number(current.durationMonths) || 0;
    let nextDuration = current.duration || splitDuration(nextDurationMonths || 1);
    const hasDurationUpdate =
      req.body.durationYears !== undefined ||
      req.body.durationMonths !== undefined ||
      req.body.durationTotalMonths !== undefined;

    if (hasDurationUpdate) {
      const timing = buildTemplateDuration({
        durationYears: req.body.durationYears,
        durationMonths: req.body.durationMonths,
        durationTotalMonths: req.body.durationTotalMonths,
      });
      nextDurationMonths = timing.durationMonths;
      nextDuration = timing.duration;
    }

    const updatedTemplate = {
      ...current,
      name: req.body.name !== undefined ? req.body.name : current.name,
      contractType: normalizeContractType(req.body.contractType, normalizeContractType(current.contractType, "INITIAL")),
      durationMonths: nextDurationMonths,
      duration: nextDuration,
      documentUrl: req.file?.filename || req.body.documentUrl || current.documentUrl || "",
      notes: req.body.notes !== undefined ? req.body.notes : current.notes,
      updatedAt: new Date().toISOString(),
    };

    const nextTemplates = [...templates];
    nextTemplates[index] = updatedTemplate;

    if (!templatesSetting) {
      await Settings.create({ key: CONTRACT_TEMPLATES_KEY, value: nextTemplates });
    } else {
      templatesSetting.value = nextTemplates;
      await templatesSetting.save();
    }

    return res.status(200).json({
      message: "Contract template updated.",
      template: updatedTemplate,
      templates: nextTemplates,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteContractTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const state = await fetchContractTemplateState();

    const nextTemplates = state.templates.filter((template) => String(template._id) !== String(templateId));
    if (nextTemplates.length === state.templates.length) {
      return res.status(404).json({ error: "Template not found." });
    }

    if (state.templatesSetting) {
      state.templatesSetting.value = nextTemplates;
      await state.templatesSetting.save();
    } else {
      await Settings.create({ key: CONTRACT_TEMPLATES_KEY, value: nextTemplates });
    }

    if (String(state.defaultTemplateId || "") === String(templateId)) {
      await Settings.findOneAndUpdate(
        { key: DEFAULT_CONTRACT_TEMPLATE_KEY },
        { value: "" },
        { upsert: true }
      );
    }

    return res.status(200).json({
      message: "Contract template deleted.",
      templates: nextTemplates,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getDefaultContractConfig = async (req, res) => {
  try {
    const { templates, defaultTemplateId } = await fetchContractTemplateState();
    const defaultTemplate = templates.find((template) => String(template._id) === String(defaultTemplateId)) || null;

    return res.status(200).json({
      defaultTemplateId,
      defaultTemplate,
      templates,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateDefaultContractConfig = async (req, res) => {
  try {
    const { templateId } = req.body;
    const { templates } = await fetchContractTemplateState();

    if (!templateId) {
      await Settings.findOneAndUpdate(
        { key: DEFAULT_CONTRACT_TEMPLATE_KEY },
        { value: "" },
        { upsert: true }
      );

      return res.status(200).json({
        message: "Default contract cleared.",
        defaultTemplateId: "",
        defaultTemplate: null,
      });
    }

    const defaultTemplate = templates.find((template) => String(template._id) === String(templateId));
    if (!defaultTemplate) {
      return res.status(404).json({ error: "Selected template was not found." });
    }

    await Settings.findOneAndUpdate(
      { key: DEFAULT_CONTRACT_TEMPLATE_KEY },
      { value: String(templateId) },
      { upsert: true }
    );

    return res.status(200).json({
      message: "Default contract updated.",
      defaultTemplateId: String(templateId),
      defaultTemplate,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const createTenant = async (req, res) => {
  try {
    
    const getFile = (fieldName) => {
       
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            return req.files[fieldName][0].filename;
        }
      
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
            return req.body[fieldName];
        }
        return null; 
    };

    const businessPermit = getFile('businessPermit');
    const validID = getFile('validID');
    const contract = getFile('contract');
    const barangayClearance = getFile('barangayClearance'); 
    const proofOfReceipt = getFile('proofOfReceipt');
    const communityTax = getFile('communityTax');       
    const policeClearance = getFile('policeClearance');

    const submittedRef = req.body.referenceNo;
    if (!submittedRef || submittedRef.trim() === "") {
        return res.status(400).json({ error: "A valid Reference / OR Number is required." });
    }

    const existingReceipt = await Tenant.findOne({
        $or: [
            { referenceNo: submittedRef },
            { "paymentHistory.referenceNo": submittedRef }
        ]
    });

    if (existingReceipt) {
        return res.status(400).json({ error: "This Reference / OR Number has already been used." });
    }

    let parsedFeeBreakdown = {};
    if (req.body.feeBreakdown) {
        try {
            parsedFeeBreakdown = typeof req.body.feeBreakdown === 'string' 
                ? JSON.parse(req.body.feeBreakdown) 
                : req.body.feeBreakdown;
        } catch (e) {
            console.error("Error parsing feeBreakdown:", e);
        }
    }

    const normalizedFeeBreakdown = normalizeFeeBreakdown(parsedFeeBreakdown, req.body.tenantType);
    req.body.utilityAmount = Number(normalizedFeeBreakdown.electricity || 0) + Number(normalizedFeeBreakdown.otherAmount || 0);

    const isPermanent = req.body.tenantType === "Permanent";
    const isNightMarket = req.body.tenantType === "Night Market";
    const advancePayment = isPermanent ? Number(req.body.advancePaymentBalance || 0) : 0;

    const rentAmt = Number(req.body.rentAmount) || 0;
    // Permanent rent should begin only after Start Operation computes proration.
    const normalizedRentAmt = isPermanent ? 0 : rentAmt;
    const utilAmt = req.body.utilityAmount || 0;
    const recurringTotal = normalizedRentAmt + utilAmt;
    const initialPaymentAmount = isPermanent ? (advancePayment + utilAmt) : recurringTotal;

    const transferApplication = req.body.transferWaitlistId
      ? await TenantApplication.findById(req.body.transferWaitlistId).lean()
      : null;
    const { templates, defaultTemplateId } = await fetchContractTemplateState();
    const selectedTemplate = resolveTemplateForOnboarding({
      templates,
      defaultTemplateId,
      transferApplication,
    });

    const contractStartDate =
      toValidDate(req.body.StartDateTime) ||
      toValidDate(transferApplication?.createdAt) ||
      new Date();
    const fallbackDurationMonths = toNonNegativeInt(transferApplication?.defaultContractDurationMonths) || 24;
    const initialDurationMonths = Math.max(toNonNegativeInt(selectedTemplate?.durationMonths) || fallbackDurationMonths, 1);
    const contractEndDate = addMonths(contractStartDate, initialDurationMonths);
    const initialContractId = isPermanent ? new mongoose.Types.ObjectId() : null;
    const initialContractDocument = isPermanent
      ? (contract || req.body.documents?.contract || selectedTemplate?.documentUrl || "")
      : "";

    const initialContract = isPermanent ? {
      _id: initialContractId,
      contractType: "INITIAL",
      startDate: contractStartDate,
      endDate: contractEndDate,
      durationMonths: initialDurationMonths,
      duration: splitDuration(initialDurationMonths),
      documentUrl: initialContractDocument,
      status: "active",
      source: req.body.transferWaitlistId ? "system" : "admin",
      assignedAt: new Date(),
      templateId: selectedTemplate?._id || transferApplication?.defaultTemplateId || "",
      templateName: selectedTemplate?.name || "",
      notes: req.body.transferWaitlistId
        ? "Auto-created active contract from approved application."
        : "Initial active contract created during onboarding.",
    } : null;

    const initialDueDate = isNightMarket ? addDays(contractStartDate, 7) : contractEndDate;
    const initialCoverageEndDate = isNightMarket ? addDays(contractStartDate, 7) : addMonths(contractStartDate, 1);

    const tenantData = {
        ...req.body,
      rentAmount: normalizedRentAmt,
      StartDateTime: contractStartDate,
      DueDateTime: initialDueDate,
        totalAmount: recurringTotal, 
        advancePaymentBalance: advancePayment,
        feeBreakdown: normalizedFeeBreakdown,
      activeContractId: initialContractId,
      contracts: initialContract ? [initialContract] : [],
      isEligibleForRenewal: false,
        paymentHistory: [{
            referenceNo: req.body.referenceNo || "Initial Payment",
            amount: initialPaymentAmount, 
            datePaid: new Date().toISOString(),
        receiptUrl: proofOfReceipt || req.body.documents?.proofOfReceipt || "",
        contractId: initialContractId,
        coverageStartDate: contractStartDate,
        coverageEndDate: initialCoverageEndDate
        }],
        
        documents: {
            ...(req.body.documents || {}),
            businessPermit: businessPermit || req.body.documents?.businessPermit,
            validID: validID || req.body.documents?.validID,
            contract: isPermanent ? initialContractDocument : "",
            barangayClearance: barangayClearance || req.body.documents?.barangayClearance, 
            proofOfReceipt: proofOfReceipt || req.body.documents?.proofOfReceipt,
            communityTax: communityTax || req.body.documents?.communityTax,             
            policeClearance: policeClearance || req.body.documents?.policeClearance 
      }
    };

    const newTenant = new Tenant(tenantData);
    const savedTenant = await newTenant.save();

    if (req.body.transferWaitlistId) {
        await TenantApplication.findByIdAndUpdate(
            req.body.transferWaitlistId,
            { status: 'TENANT' } 
        );
    }

    const subject = "Final Approval - Welcome to IBT Stalls!";
    const paymentRuleLine = isNightMarket
      ? `4. Weekly rent is due every 7 days from your approved start date.\n5. Missed weekly payments trigger operation pause and may lead to termination after the configured grace period.`
      : `4. Monthly rent is due on the ${new Date(savedTenant.StartDateTime).getDate()}th of every month.`;

    const message = `
Congratulations ${savedTenant.tenantName}!

You have been officially approved as a tenant at Zamboanga City IBT.

DETAILS:
--------------------------------
Stall Number: ${savedTenant.slotNo}
Tenant Type:  ${savedTenant.tenantType}
Rent Amount:  ₱${savedTenant.rentAmount}

RULES AND REGULATIONS:
1. Operating hours are from 5:00 PM to 12:00 AM.
2. Keep your area clean at all times.
3. No sub-leasing of stalls is allowed.
${paymentRuleLine}

You may now start operating your business.

Welcome aboard!
IBT Management
    `;

   if (savedTenant.email) {
        try {
        
            await sendEmail({
                email: savedTenant.email,
                subject: subject,
                message: message
            });

            const user = await User.findOne({ email: savedTenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Welcome to IBT Stalls! 🎉", 
                    `Congratulations! You are officially the tenant of Slot ${savedTenant.slotNo}.`,
                    { route: 'stalls' }
                );
            }
        } catch (emailError) {
            console.error("Welcome email/push failed:", emailError.message);
        }
    }

    res.status(201).json(savedTenant);

  } catch (error) {
    console.error("Create Tenant Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
  
    const oldTenant = await Tenant.findById(req.params.id);

    const updateData = { ...req.body };

    // Contract subdocuments are managed via dedicated /contracts endpoints.
    // Ignore any contracts payload sent through generic tenant edit to avoid cast errors.
    if (updateData.contracts !== undefined) {
      delete updateData.contracts;
    }

    if (updateData.feeBreakdown) {
        try {
            updateData.feeBreakdown = typeof updateData.feeBreakdown === 'string' 
                ? JSON.parse(updateData.feeBreakdown) 
                : updateData.feeBreakdown;
        } catch (e) {
            console.error("Error parsing feeBreakdown:", e);
        }
    }

    if (updateData.paymentHistory) {
        if (typeof updateData.paymentHistory === 'string') {
            if (updateData.paymentHistory.includes('[object Object]')) {
               
                delete updateData.paymentHistory;
            } else {
               
                try {
                    updateData.paymentHistory = JSON.parse(updateData.paymentHistory);
                } catch (e) {
                    console.error("Error parsing paymentHistory:", e);
                    delete updateData.paymentHistory; 
                }
            }
        }
    }

    const effectiveTenantType = updateData.tenantType || oldTenant.tenantType;
    const normalizedFeeBreakdown = normalizeFeeBreakdown(updateData.feeBreakdown || oldTenant.feeBreakdown || {}, effectiveTenantType);
    updateData.feeBreakdown = normalizedFeeBreakdown;
    updateData.utilityAmount = Number(normalizedFeeBreakdown.electricity || 0) + Number(normalizedFeeBreakdown.otherAmount || 0);
 
    const currentStatus = String(oldTenant.status || "").toLowerCase();
    const requestedStatus = String(updateData.status !== undefined ? updateData.status : oldTenant.status || "").toLowerCase();
    const wasOverdue = currentStatus === "overdue";
    const nextIsOverdue = requestedStatus === "overdue";

    const rent = Number(updateData.rentAmount !== undefined ? updateData.rentAmount : (oldTenant.rentAmount || 0));
    const util = updateData.utilityAmount !== undefined ? Number(updateData.utilityAmount) : Number(oldTenant.utilityAmount || 0);

    if (nextIsOverdue && !wasOverdue) {
      const isNightMarket = effectiveTenantType === "Night Market";
      const chargeKey = isNightMarket ? "nightMarketChargePercentage" : "permanentChargePercentage";
      const interestKey = isNightMarket ? "nightMarketInterestPercentage" : "permanentInterestPercentage";

      const chargeSetting = await Settings.findOne({ key: chargeKey });
      const interestSetting = await Settings.findOne({ key: interestKey });

      const cPct = chargeSetting ? Number(chargeSetting.value) : 25;
      const iPct = interestSetting ? Number(interestSetting.value) : 2;

      const cycleCharge = rent * (cPct / 100);
      const grossRentWithCharge = rent + cycleCharge;
      const cycleInterest = grossRentWithCharge * (iPct / 100);

      updateData.chargeAmount = cycleCharge;
      updateData.interestAmount = cycleInterest;
      updateData.totalAmount = grossRentWithCharge + cycleInterest + util;
      updateData.overdueChargePercentage = cPct;
      updateData.overdueInterestPercentage = iPct;
      updateData.overdueCycleCount = 1;
      updateData.lastOverdueAppliedAt = new Date();
    } else if (nextIsOverdue && wasOverdue) {
      const oldUtil = Number(oldTenant.utilityAmount || 0);
      const outstandingWithoutUtility = Math.max(0, Number(oldTenant.totalAmount || 0) - oldUtil);

      updateData.chargeAmount = Number(oldTenant.chargeAmount || 0);
      updateData.interestAmount = Number(oldTenant.interestAmount || 0);
      updateData.totalAmount = outstandingWithoutUtility + util;
      updateData.overdueChargePercentage = Number.isFinite(Number(oldTenant.overdueChargePercentage))
        ? Number(oldTenant.overdueChargePercentage)
        : null;
      updateData.overdueInterestPercentage = Number.isFinite(Number(oldTenant.overdueInterestPercentage))
        ? Number(oldTenant.overdueInterestPercentage)
        : null;
      updateData.overdueCycleCount = Number(oldTenant.overdueCycleCount || 0);
      updateData.lastOverdueAppliedAt = oldTenant.lastOverdueAppliedAt || null;
    } else {
      updateData.chargeAmount = 0;
      updateData.interestAmount = 0;
      updateData.totalAmount = rent + util;
      updateData.overdueChargePercentage = null;
      updateData.overdueInterestPercentage = null;
      updateData.overdueCycleCount = 0;
      updateData.lastOverdueAppliedAt = null;
    }

    const getFile = (fieldName) => {
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            return req.files[fieldName][0].filename;
        }
        return null; 
    };

    const newPermit = getFile('businessPermit');
    const newID = getFile('validID');
    const newContract = getFile('contract');
    const newClearance = getFile('barangayClearance'); 
    const newReceipt = getFile('proofOfReceipt');
    const newCommunityTax = getFile('communityTax');      
    const newPoliceClearance = getFile('policeClearance');     

    if (newPermit) updateData['documents.businessPermit'] = newPermit;
    if (newID) updateData['documents.validID'] = newID;
    if (newContract) updateData['documents.contract'] = newContract;
    if (newClearance) updateData['documents.barangayClearance'] = newClearance; 
    if (newReceipt) updateData['documents.proofOfReceipt'] = newReceipt;
    if (newCommunityTax) updateData['documents.communityTax'] = newCommunityTax;             
    if (newPoliceClearance) updateData['documents.policeClearance'] = newPoliceClearance;


    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedTenant) return res.status(404).json({ error: "Tenant not found" });

    
    if (oldTenant && oldTenant.status !== 'Overdue' && updatedTenant.status === 'Overdue' && updatedTenant.email) {
      try {
       
        const rent = updatedTenant.rentAmount || 0;
        const totalAmount = updatedTenant.totalAmount || rent;
        const dueDate = updatedTenant.DueDateTime ? new Date(updatedTenant.DueDateTime) : new Date();
        const computationDate = new Date();
        
        
        const lastPayment = updatedTenant.paymentHistory && updatedTenant.paymentHistory.length > 0 
          ? updatedTenant.paymentHistory.sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid))[0]
          : null;
        
        const lastPaymentMonth = lastPayment ? new Date(lastPayment.datePaid).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';
        const lastPaymentAmount = lastPayment ? lastPayment.amount : 0;
        
      
        const dueMonth = dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const currentMonth = computationDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const periodText = dueMonth === currentMonth ? dueMonth : `${dueMonth} to ${currentMonth}`;
        
       const subject = "Final Notice: Overdue Rent Payment";
       const message = `Sir/Ma'am ${updatedTenant.tenantName || updatedTenant.name},

This serves as our final notice for your settle your unpaid rent for the space you occupy at Integrated Bus Terminal which now amounts to ₱${totalAmount.toLocaleString()}, inclusive of surcharge and interests, covering the period of ${periodText}, computed as of ${computationDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. The last payment you made was on ${lastPaymentMonth} amounting to ₱${lastPaymentAmount.toLocaleString()}. No payment has been made thereafter, thus this bill.

Kindly settle your account within five (5) days from receipt hereof. Otherwise, we will forward this matter to the Office of the City Legal for appropriate legal action to the effect collection of the same.

Thank you`;

        await sendEmail({ email: updatedTenant.email, subject, message });

        const user = await User.findOne({ email: updatedTenant.email });
        if (user && user.expoPushToken) {
            await sendPushNotification(
                user.expoPushToken, 
                "Rent Overdue! ⚠️", 
                `Your rent for Slot ${updatedTenant.slotNo} is now overdue. Please settle your account immediately to avoid penalties.`,
                { route: 'stalls' }
            );
        }

      } catch (err) {
        console.error("Overdue email or push notification failed:", err.message);
      }
    }


    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Update Tenant Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }
    res.status(500).json({ error: error.message });
  }

};


export const getDefaultNightPrice = async (req, res) => {
  try {
    const { basePrice, weeklyRent } = await getNightMarketPricing();
    res.status(200).json({ defaultPrice: basePrice, weeklyRent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateAllNightMarketPrices = async (req, res) => {
  try {
    const { newPrice, newBasePrice, newWeeklyRent } = req.body;

    const rawBasePrice = newBasePrice !== undefined ? newBasePrice : newPrice;
    if (rawBasePrice === undefined || rawBasePrice === null || rawBasePrice === "") {
      return res.status(400).json({ error: "Night Market base price is required." });
    }

    const parsedBasePrice = Number(rawBasePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
      return res.status(400).json({ error: "Valid Night Market base price is required." });
    }

    const currentPricing = await getNightMarketPricing();
    const resolvedWeeklyRent =
      newWeeklyRent !== undefined && newWeeklyRent !== null && String(newWeeklyRent).trim() !== ""
        ? Number(newWeeklyRent)
        : currentPricing.weeklyRent;

    if (!Number.isFinite(resolvedWeeklyRent) || resolvedWeeklyRent <= 0) {
      return res.status(400).json({ error: "Valid Night Market weekly rent is required." });
    }

    const basePriceValue = Number(parsedBasePrice);
    const weeklyRentValue = Number(resolvedWeeklyRent);
    const basePriceString = basePriceValue.toString();

    await Settings.findOneAndUpdate(
      { key: NIGHT_MARKET_BASE_PRICE_KEY },
      { key: NIGHT_MARKET_BASE_PRICE_KEY, value: basePriceValue },
      { upsert: true, new: true }
    );

    await Settings.findOneAndUpdate(
      { key: NIGHT_MARKET_WEEKLY_RENT_KEY },
      { key: NIGHT_MARKET_WEEKLY_RENT_KEY, value: weeklyRentValue },
      { upsert: true, new: true }
    );

    const tenants = await Tenant.find({ tenantType: "Night Market", isArchived: { $ne: true } });
    let updatedCount = 0;

    for (const t of tenants) {
        
        if (t.status === "Paid") {
          const slotCount = getSlotCount(t.slotNo);
          const newRent = weeklyRentValue * slotCount;
            const newTotal = newRent + (t.utilityAmount || 0);

            await Tenant.updateOne(
                { _id: t._id },
                { $set: { rentAmount: newRent, totalAmount: newTotal } }
            );
            updatedCount++;

            if (t.email) {
                try {
                    const user = await User.findOne({ email: t.email });
                    if (user && user.expoPushToken) {
                        await sendPushNotification(
                            user.expoPushToken,
                            "Rent Price Updated!",
                            `Notice: Your upcoming weekly rental fee for Slot ${t.slotNo} is now ₱${newRent.toLocaleString()}.`,
                            { route: 'stalls' }
                        );
                    }
                } catch (notifyErr) {
                    console.error("Push failed:", notifyErr.message);
                }
            }
        }
    }

    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Night Market" }, { preferredType: "Night Market" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: basePriceString }
    );

    res.status(200).json({
      message: `Updated Night Market base and weekly rates. Modified ${updatedCount} active tenants and ${applicationResult.modifiedCount} pending applications.`,
      tenantModifiedCount: updatedCount,
      applicationModifiedCount: applicationResult.modifiedCount,
      basePrice: basePriceValue,
      weeklyRent: weeklyRentValue,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getDefaultPermanentPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 6000;
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAllPermanentPrices = async (req, res) => {
  try {
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    const priceValue = parseFloat(newPrice);
    const priceString = priceValue.toString(); 

    await Settings.findOneAndUpdate(
      { key: "defaultPermanentPrice" },
      { key: "defaultPermanentPrice", value: priceValue },
      { upsert: true, new: true }
    );

    const startedPaidTenantsCount = await Tenant.countDocuments({
      $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }],
      isArchived: { $ne: true },
      status: "Paid",
      operationStartDate: { $exists: true, $ne: null }
    });

    // Do not overwrite current due-cycle amounts for existing permanent tenants.
    // The new global price will be picked up on the next approved payment cycle.
    const updatedCount = 0;

    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Permanent" }, { preferredType: "Permanent" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: priceString }
    );

    res.status(200).json({
      message: `Updated global permanent price. Existing tenants keep their current next due amount; new price applies starting the following billing cycle.`,
      tenantModifiedCount: updatedCount,
      tenantDeferredCount: startedPaidTenantsCount,
      applicationModifiedCount: applicationResult.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveRenewalPayment = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const submittedRef = tenant.referenceNo || tenant.paymentReference || tenant.referenceno;
    
    if (!submittedRef || submittedRef === "N/A" || submittedRef.trim() === "") {
        return res.status(400).json({ error: "Cannot approve: No Reference/OR Number was provided." });
    }

    const existingHistoryReceipt = await Tenant.findOne({
        "paymentHistory.referenceNo": submittedRef
    });

    if (existingHistoryReceipt) {
        return res.status(400).json({ error: "This Reference / OR Number was already used in a previous month." });
    }

    const isNightMarket = tenant.tenantType === 'Night Market';
    
    const baseDate = tenant.DueDateTime ? new Date(tenant.DueDateTime) : 
                     (tenant.StartDateTime ? new Date(tenant.StartDateTime) : new Date());
                     
    const currentDue = new Date(baseDate);

    if (isNightMarket) {
        currentDue.setDate(currentDue.getDate() + 7);
    } else {
        currentDue.setMonth(currentDue.getMonth() + 1);

        const dueDateSetting = await Settings.findOne({ key: "permanentDueDate" });
        const targetDay = dueDateSetting ? Number(dueDateSetting.value) : 5;
        
        const daysInNextMonth = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, 0).getDate();
        currentDue.setDate(Math.min(targetDay, daysInNextMonth));
    }

    const slotCount = getSlotCount(tenant.slotNo);
    let nextRentAmount = 0;

    if (isNightMarket) {
      const { weeklyRent } = await getNightMarketPricing();
      nextRentAmount = weeklyRent * slotCount;
    } else {
      const defaultPriceSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
      const defaultPrice = defaultPriceSetting ? Number(defaultPriceSetting.value) : 6000;
      nextRentAmount = defaultPrice * slotCount;
    }

    const nextTotalAmount = nextRentAmount + (tenant.utilityAmount || 0);
    
    const paymentRecord = {
        referenceNo: submittedRef || "N/A", 
        amount: tenant.totalAmount || tenant.rentAmount || 0, 
        datePaid: new Date().toISOString(),
        receiptUrl: tenant.documents?.proofOfReceipt || tenant.receiptUrl || "" 
    };

    const nightMarketReset = isNightMarket
      ? {
          isOperationPaused: false,
          operationPauseReason: null,
          lastPausedDate: null,
          nightMarketTerminationAt: null,
          nightMarketTerminationWarningNotifiedAt: null,
        }
      : {};

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { 
          status: "Paid", 
          DueDateTime: currentDue.toISOString(),
          rentAmount: nextRentAmount,    
          totalAmount: nextTotalAmount,  
          chargeAmount: 0,               
          interestAmount: 0,    
          overdueChargePercentage: null,
          overdueInterestPercentage: null,
          overdueCycleCount: 0,
          lastOverdueAppliedAt: null,
          advanceUsedForPenalties: 0,        
          ...nightMarketReset,
          $push: { paymentHistory: paymentRecord },
          $unset: { 
              referenceNo: "",
              paymentReference: "", 
              referenceno: "",
              "documents.proofOfReceipt": "",
              receiptUrl: "" 
          }
      },
      { new: true }
    );

    if (updatedTenant.email) {
      const subject = "Payment Approved - IBT Stalls Renewal";
      const message = `Dear ${updatedTenant.tenantName},

Your renewal payment of ₱${paymentRecord.amount} has been successfully verified and approved.

DETAILS:
--------------------------------
Stall Number: ${updatedTenant.slotNo}
Reference No: ${paymentRecord.referenceNo}
Next Due Date: ${new Date(updatedTenant.DueDateTime).toLocaleDateString()}

Thank you for your continued tenancy!

Best regards,
IBT Management`;

      try {
          
          await sendEmail({
              email: updatedTenant.email,
              subject: subject,
              message: message
          });

          const user = await User.findOne({ email: updatedTenant.email });
          if (user && user.expoPushToken) {
              await sendPushNotification(
                  user.expoPushToken, 
                  "Payment Approved ✅", 
                  `Your renewal payment of ₱${paymentRecord.amount} for Slot ${updatedTenant.slotNo} was approved!`,
                  { route: 'stalls' }
              );
          }
      } catch (notifyError) {
          console.error("Renewal approval notifications failed:", notifyError.message);
      }
    }

    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Approve Renewal Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }

    res.status(500).json({ error: error.message });
  }
};

export const approveRenewalContractRequest = async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const tenant = await Tenant.findById(id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use renewal contracts." });
    }

    const contract = tenant.contracts.id(contractId);
    if (!contract) return res.status(404).json({ error: "Renewal contract request not found." });

    if (contract.status !== "pending_approval") {
      return res.status(400).json({ error: "Only pending renewal requests can be approved." });
    }

    contract.status = "approved_awaiting_start";
    contract.approvedAt = new Date();
    contract.rejectedAt = null;
    contract.rejectedReason = "";
    tenant.isEligibleForRenewal = false;

    await tenant.save();

    if (tenant.email) {
      try {
        await sendEmail({
          email: tenant.email,
          subject: "Renewal Contract Approved - Awaiting Start",
          message: `Dear ${tenant.tenantName || tenant.name},\n\nYour renewal contract request for Slot ${tenant.slotNo} has been approved.\n\nThe renewed contract will activate automatically on ${new Date(contract.startDate).toLocaleDateString()}.\n\nThank you,\nIBT Management`,
        });

        const user = await User.findOne({ email: tenant.email });
        if (user?.expoPushToken) {
          await sendPushNotification(
            user.expoPushToken,
            "Renewal Approved ✅",
            `Your renewal for Slot ${tenant.slotNo} was approved. It will activate on ${new Date(contract.startDate).toLocaleDateString()}.`,
            { route: "stalls" },
          );
        }
      } catch (notifyError) {
        console.error("Renewal contract approval notification failed:", notifyError.message);
      }
    }

    return res.status(200).json({
      message: "Renewal contract request approved.",
      tenant,
      contract,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const rejectRenewalContractRequest = async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const { rejectionReason } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (tenant.tenantType === "Night Market") {
      return res.status(400).json({ error: "Night Market tenants do not use renewal contracts." });
    }

    const contract = tenant.contracts.id(contractId);
    if (!contract) return res.status(404).json({ error: "Renewal contract request not found." });

    if (contract.status !== "pending_approval") {
      return res.status(400).json({ error: "Only pending renewal requests can be rejected." });
    }

    contract.status = "rejected";
    contract.rejectedAt = new Date();
    contract.rejectedReason = rejectionReason || "Invalid or incomplete renewal contract.";
    contract.notes = `${contract.notes || ""}${contract.notes ? "\n" : ""}Rejected: ${contract.rejectedReason}`;

    const activeContract =
      (typeof tenant.getActiveContract === "function" ? tenant.getActiveContract() : null) ||
      tenant.contracts.find((entry) => entry.status === "active");
    const shouldReopenRenewal =
      !!activeContract &&
      activeContract.endDate &&
      daysUntil(activeContract.endDate) <= 30 &&
      daysUntil(activeContract.endDate) >= 0;
    tenant.isEligibleForRenewal = shouldReopenRenewal;

    await tenant.save();

    if (tenant.email) {
      try {
        await sendEmail({
          email: tenant.email,
          subject: "Renewal Contract Rejected",
          message: `Dear ${tenant.tenantName || tenant.name},\n\nYour submitted renewal contract for Slot ${tenant.slotNo} was rejected.\n\nReason: ${contract.rejectedReason}\n\nPlease submit a new renewal contract in the mobile app.\n\nThank you,\nIBT Management`,
        });

        const user = await User.findOne({ email: tenant.email });
        if (user?.expoPushToken) {
          await sendPushNotification(
            user.expoPushToken,
            "Renewal Rejected",
            `Your renewal request for Slot ${tenant.slotNo} was rejected. Please submit a corrected contract.`,
            { route: "stalls" },
          );
        }
      } catch (notifyError) {
        console.error("Renewal contract rejection notification failed:", notifyError.message);
      }
    }

    return res.status(200).json({
      message: "Renewal contract request rejected.",
      tenant,
      contract,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const sendRentReminder = async (req, res) => {
  try {
    const { tenantId, isOverdue } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const user = await User.findOne({ email: tenant.email });
    if (!user || !user.expoPushToken) {
      return res.status(400).json({ error: "Tenant does not have app notifications enabled." });
    }

    const amountDue = tenant.totalAmount || tenant.rentAmount || 0;
    
    const title = isOverdue ? "Rent Overdue! ⚠️" : "Rent Reminder 📅";
    const body = isOverdue 
      ? `Hi ${tenant.tenantName}, your rent of ₱${amountDue.toLocaleString()} for Slot ${tenant.slotNo} is now OVERDUE. Please pay immediately.`
      : `Hi ${tenant.tenantName}, your rent of ₱${amountDue.toLocaleString()} for Slot ${tenant.slotNo} is due soon.`;

    await sendPushNotification(user.expoPushToken, title, body, { 
        route: 'stalls', 
        targetSlot: tenant.slotNo 
    });

    res.status(200).json({ message: "Push notification reminder sent successfully!" });
  } catch (error) {
    console.error("Rent Reminder Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getOverdueSettings = async (req, res) => {
  try {
    const { weeklyRent: nightMarketWeeklyRent } = await getNightMarketPricing();
    const pCharge = await Settings.findOne({ key: "permanentChargePercentage" });
    const pInterest = await Settings.findOne({ key: "permanentInterestPercentage" });
    const nCharge = await Settings.findOne({ key: "nightMarketChargePercentage" });
    const nInterest = await Settings.findOne({ key: "nightMarketInterestPercentage" });
    const nMaxTerminationDays = await Settings.findOne({ key: "nightMarketMaxTerminationDays" });
    const pDueDate = await Settings.findOne({ key: "permanentDueDate" });
    const pDailyFee = await Settings.findOne({ key: "permanentDailyFee" });

    res.status(200).json({
      permanentCharge: pCharge ? Number(pCharge.value) : 25,
      permanentInterest: pInterest ? Number(pInterest.value) : 2,
      nightMarketCharge: nCharge ? Number(nCharge.value) : 25,
      nightMarketInterest: nInterest ? Number(nInterest.value) : 2,
      nightMarketWeeklyRent,
      nightMarketMaxTerminationDays: nMaxTerminationDays ? Number(nMaxTerminationDays.value) : 3,
      permanentDueDate: pDueDate ? Number(pDueDate.value) : 5,
      dailyFee: pDailyFee ? Number(pDailyFee.value) : 200,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOverdueSettings = async (req, res) => {
  try {
    const { tenantType, chargePercentage, interestPercentage, permanentDueDate, dailyFee, nightMarketMaxTerminationDays } = req.body;
    
    const isNightMarket = tenantType === "Night Market";
    const chargeKey = isNightMarket ? "nightMarketChargePercentage" : "permanentChargePercentage";
    const interestKey = isNightMarket ? "nightMarketInterestPercentage" : "permanentInterestPercentage";

    const currentChargeSetting = await Settings.findOne({ key: chargeKey });
    const currentInterestSetting = await Settings.findOne({ key: interestKey });
    const currentChargePct = currentChargeSetting ? Number(currentChargeSetting.value) : 25;
    const currentInterestPct = currentInterestSetting ? Number(currentInterestSetting.value) : 2;

    if (chargePercentage !== undefined || interestPercentage !== undefined) {
      const tenantTypeFilter = isNightMarket
        ? { tenantType: "Night Market" }
        : { $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }] };

      await Tenant.updateMany(
        {
          ...tenantTypeFilter,
          isArchived: { $ne: true },
          status: "Overdue",
          $or: [
            { overdueChargePercentage: { $exists: false } },
            { overdueChargePercentage: null },
            { overdueInterestPercentage: { $exists: false } },
            { overdueInterestPercentage: null },
          ],
        },
        {
          $set: {
            overdueChargePercentage: currentChargePct,
            overdueInterestPercentage: currentInterestPct,
          },
        },
      );
    }

    if (chargePercentage !== undefined) {
      await Settings.findOneAndUpdate(
        { key: chargeKey },
        { value: Number(chargePercentage) },
        { upsert: true }
      );
    }

    if (interestPercentage !== undefined) {
      await Settings.findOneAndUpdate(
        { key: interestKey },
        { value: Number(interestPercentage) },
        { upsert: true }
      );
    }

    if (isNightMarket && nightMarketMaxTerminationDays !== undefined) {
      const parsedMaxDays = Math.max(1, Math.floor(Number(nightMarketMaxTerminationDays) || 0));
      await Settings.findOneAndUpdate(
        { key: "nightMarketMaxTerminationDays" },
        { value: parsedMaxDays },
        { upsert: true }
      );
    }

    if (!isNightMarket && dailyFee !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "permanentDailyFee" },
        { value: Number(dailyFee) },
        { upsert: true }
      );
    }

   if (!isNightMarket && permanentDueDate !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "permanentDueDate" }, 
        { value: Number(permanentDueDate) }, 
        { upsert: true }
      );

      const targetDay = Number(permanentDueDate);
      const permanentTenants = await Tenant.find({
        $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }],
        isArchived: { $ne: true }
      });

      for (const t of permanentTenants) {
        if (t.DueDateTime) {
          const currentDue = new Date(t.DueDateTime);
          
          if (!isNaN(currentDue.getTime())) {
              const daysInMonth = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, 0).getDate();
              currentDue.setDate(Math.min(targetDay, daysInMonth));
              
              await Tenant.updateOne(
                  { _id: t._id },
                  { $set: { DueDateTime: currentDue.toISOString() } }
              );
          }
        }
      }
    }

    res.status(200).json({
      message: `Overdue settings for ${tenantType} updated successfully. New rates will only apply to future overdue cycles.`,
      updatedTenants: 0
    });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const startOperation = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (isAutoPausedForNonPayment(tenant) && hasOutstandingOverdueBalance(tenant)) {
      return res.status(400).json({
        error: "Operations are paused after 2 months of unpaid balance. Please settle the remaining balance first.",
      });
    }

    const operationStartDate = new Date();
    tenant.operationStartDate = operationStartDate;
    tenant.isOperationPaused = false;
    tenant.operationPauseReason = null;
    tenant.lastPausedDate = null;

    const isNightMarketTenant = tenant.tenantType === "Night Market";
    const isPermanentTenant = tenant.tenantType === "Permanent" || !tenant.tenantType;

    if (isPermanentTenant) {
      const dueDateSetting = await Settings.findOne({ key: "permanentDueDate" });
      const dailyFeeSetting = await Settings.findOne({ key: "permanentDailyFee" });
      const targetDay = dueDateSetting ? Number(dueDateSetting.value) : 5;
      const dailyFee = dailyFeeSetting ? Number(dailyFeeSetting.value) : 200;

      const billingStartDate = addDays(startOfDay(operationStartDate), 1);
      let dueDate = withDayInMonth(billingStartDate, targetDay);
      if (dueDate < billingStartDate) {
        dueDate = withDayInMonth(addMonths(billingStartDate, 1), targetDay);
      }

      const msPerDay = 24 * 60 * 60 * 1000;
      const dayDiff = Math.floor((startOfDay(dueDate).getTime() - billingStartDate.getTime()) / msPerDay);
      const billableDays = Math.max(0, dayDiff + 1);
      const slotCount = tenant.slotNo
        ? String(tenant.slotNo).split(",").map((slot) => slot.trim()).filter(Boolean).length
        : 1;

      const proratedRent = Math.max(0, Number(dailyFee) || 0) * Math.max(1, slotCount) * billableDays;
      const utilityAmount = Number(tenant.utilityAmount) || 0;

      tenant.rentAmount = proratedRent;
      tenant.totalAmount = proratedRent + utilityAmount;
      tenant.DueDateTime = dueDate;
    }

    if (isNightMarketTenant) {
      const { basePrice } = await getNightMarketPricing();
      const slotCount = getSlotCount(tenant.slotNo);
      const operationStartDay = startOfDay(operationStartDate);
      const remainingDaysInWeek = Math.max(1, 7 - operationStartDay.getDay());
      const dueDate = addDays(operationStartDay, remainingDaysInWeek);
      const utilityAmount = Number(tenant.utilityAmount) || 0;
      const proratedRent = Math.max(0, Number(basePrice) || 0) * slotCount * remainingDaysInWeek;

      tenant.rentAmount = proratedRent;
      tenant.totalAmount = proratedRent + utilityAmount;
      tenant.DueDateTime = dueDate;
    }

    await tenant.save();

    if (tenant.email) {
        try {
            const subject = "Green Light: Official Start of Operations";
            const message = `Dear ${tenant.tenantName || tenant.name},\n\nGreat news! Management has officially recorded today, ${new Date().toLocaleDateString()}, as your Day 1 of operations for Slot ${tenant.slotNo}.\n\nYour "Days of Operation" timeline is now active and ticking.\n\nWe wish you the best of luck and great success with your business!\n\nThank you,\nIBT Management`;

            await sendEmail({ email: tenant.email, subject, message });

            const user = await User.findOne({ email: tenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Operations Started! ", 
                    `Your official Day 1 for Slot ${tenant.slotNo} has been recorded. Good luck!`,
                    { route: 'stalls' }
                );
            }
        } catch (notifyErr) {
            console.error("Failed to send start operation notifications:", notifyErr.message);
        }
    }
   
    res.status(200).json({ message: "Operation started successfully", tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const toggleOperationStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    let actionTaken = "";

    if (tenant.isOperationPaused) {
      if (isAutoPausedForNonPayment(tenant) && hasOutstandingOverdueBalance(tenant)) {
        return res.status(400).json({
          error: "Cannot resume operations yet. Please pay the remaining overdue balance first.",
        });
      }
        
        const now = new Date();
      const validLastPausedDate = toValidDate(tenant.lastPausedDate);
      const pauseDurationMs = validLastPausedDate ? (now - validLastPausedDate) : 0;
      const pauseDurationDays = pauseDurationMs / (1000 * 60 * 60 * 24);

        tenant.totalPausedDays += pauseDurationDays;
        tenant.isOperationPaused = false;
      tenant.operationPauseReason = null;
        tenant.lastPausedDate = null;
        actionTaken = "resumed";
    } else {
       
        tenant.isOperationPaused = true;
      tenant.operationPauseReason = "MANUAL";
        tenant.lastPausedDate = new Date();
        actionTaken = "paused";
    }

    await tenant.save();

   
    if (tenant.email) {
        try {
            const subject = actionTaken === "paused" 
                ? "Notice: Lease Operations Paused" 
                : "Notice: Lease Operations Resumed";
                
            const message = actionTaken === "paused"
                ? `Dear ${tenant.tenantName || tenant.name},\n\nThis is to confirm that your operations for Slot ${tenant.slotNo} have been officially paused effective ${new Date().toLocaleDateString()}. Your "Days of Operation" counter will be frozen during this period.\n\nPlease contact management if you have any questions.\n\nThank you.`
                : `Dear ${tenant.tenantName || tenant.name},\n\nThis is to confirm that your operations for Slot ${tenant.slotNo} have been officially resumed effective ${new Date().toLocaleDateString()}. Your "Days of Operation" counter is now active again.\n\nWelcome back!\n\nThank you.`;

          
            await sendEmail({ email: tenant.email, subject, message });

           
            const user = await User.findOne({ email: tenant.email });
            if (user && user.expoPushToken) {
                const title = actionTaken === "paused" ? "Operations Paused ⏸" : "Operations Resumed ▶";
                const body = `Your operations for Slot ${tenant.slotNo} have been ${actionTaken}.`;
                
                await sendPushNotification(
                    user.expoPushToken, 
                    title, 
                    body, 
                    { route: 'stalls' }
                );
            }
        } catch (notifyErr) {
            console.error("Failed to send pause/resume notifications:", notifyErr.message);
        }
    }
   
    res.status(200).json({ message: "Operation status toggled", tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processMoveOut = async (req, res) => {
  try {
    const { tenantId, damageCost, damageRemarks, consumeDeposit } = req.body;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const damages = Number(damageCost) || 0;
    const advanceBal = tenant.advancePaymentBalance || 0;
    const unpaidDue = tenant.status === "Overdue" ? (tenant.totalAmount || 0) : 0; 
    const rentAmount = tenant.rentAmount || 0;
    
    const lastMonthDeduction = consumeDeposit ? rentAmount : 0;
    const totalDeductions = damages + unpaidDue + lastMonthDeduction;
    const finalRefund = advanceBal - totalDeductions;
    
    const moveOutDetails = {
        damageCost: damages,
        damageRemarks: damageRemarks || "None",
        lastMonthRentDeducted: lastMonthDeduction,
        unpaidDuesDeducted: unpaidDue,
        finalRefund: finalRefund > 0 ? finalRefund : 0,
        remainingDebt: finalRefund < 0 ? Math.abs(finalRefund) : 0
    };

    const moveOutTransaction = {
        referenceNo: "MOVE-OUT-SETTLEMENT",
        amount: finalRefund > 0 ? finalRefund : 0, 
        datePaid: new Date().toISOString(),
        receiptUrl: "Settlement"
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, {
        status: "Moved Out",
        isArchived: true, 
        slotNo: `${tenant.slotNo} (Archived)`, 
        moveOutDate: new Date().toISOString(),
        moveOutDetails: moveOutDetails,
        $push: { paymentHistory: moveOutTransaction }
    }, { new: true, runValidators: false });

    await TenantApplication.findOneAndUpdate(
        { targetSlot: tenant.slotNo, status: "TENANT" },
        { 
            status: "MOVED OUT",
            $set: {
                moveOutDetails: moveOutDetails,
                advancePaymentBalance: advanceBal
            }
        },
        { strict: false } 
    );
   
    if (updatedTenant.email) {
        try {
            const subject = "Lease Termination & Final Accounting - IBT Stalls";
            let message = `Dear ${updatedTenant.tenantName || updatedTenant.name},\n\nThis confirms your official move-out and lease termination.\n\nFINAL ACCOUNTING:\nAdvance Deposit: ₱${advanceBal.toLocaleString()}\n`;
            
            if (consumeDeposit) message += `Less Last Month's Rent: ₱${lastMonthDeduction.toLocaleString()}\n`;
            message += `Less Damages: ₱${damages.toLocaleString()}\n`;
            if (unpaidDue > 0) message += `Less Unpaid Dues: ₱${unpaidDue.toLocaleString()}\n`;
            
            message += `\nFINAL REFUND AMOUNT: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}\n`;
            
            if (finalRefund < 0) {
                message += `\nNote: You have an outstanding remaining debt of ₱${Math.abs(finalRefund).toLocaleString()} which must be settled.`;
            } else if (finalRefund > 0 && damages === 0 && unpaidDue === 0 && !consumeDeposit) {
                message += `\nGood news! Since you have no accumulated damages or unpaid dues, your advance payment is fully refunded.`;
            } else if (consumeDeposit) {
                message += `\nYour advance deposit was successfully used to cover your last month's rent as requested.`;
            }
            
            message += `\n\nThank you for doing business with IBT.`;

            await sendEmail({ email: updatedTenant.email, subject, message });

            const user = await User.findOne({ email: updatedTenant.email });
            if (user && user.expoPushToken) {
                let pushTitle = "Move-Out Confirmed 📦";
                let pushBody = `Your lease for Slot ${updatedTenant.slotNo.replace(' (Archived)', '')} is terminated. Final Refund: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}.`;
                
                if (consumeDeposit) pushBody = `Deposit used for last month's rent. Final Refund: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}.`;
                if (finalRefund < 0) pushBody = `Move out processed. You have a remaining debt of ₱${Math.abs(finalRefund).toLocaleString()}.`;
                
                await sendPushNotification(user.expoPushToken, pushTitle, pushBody, { route: 'stalls' });
            }

        } catch (emailErr) {
            console.error("Failed to send move-out notifications:", emailErr.message);
        }
    }

    res.status(200).json({ message: "Move-out processed successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("Move Out Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const rejectRenewalPayment = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const isPastDue = tenant.DueDateTime && new Date(tenant.DueDateTime) < new Date();
    const revertedStatus = isPastDue ? "Overdue" : "Paid";
    const statusUpdate = { status: revertedStatus };

    if (revertedStatus !== "Overdue") {
      statusUpdate.chargeAmount = 0;
      statusUpdate.interestAmount = 0;
      statusUpdate.overdueChargePercentage = null;
      statusUpdate.overdueInterestPercentage = null;
      statusUpdate.overdueCycleCount = 0;
      statusUpdate.lastOverdueAppliedAt = null;
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { 
          ...statusUpdate,
          $unset: { 
              paymentReference: "", 
              referenceNo: "",
              referenceno: "",
              "documents.proofOfReceipt": "",
              receiptUrl: "" 
          }
      },
      { new: true }
    );

    if (updatedTenant.email) {
        try {
            const subject = "Payment Rejected - IBT Stalls Renewal";
            const message = `Dear ${updatedTenant.tenantName || updatedTenant.name},\n\nYour recent renewal payment receipt could not be verified and has been REJECTED.\n\nReason for rejection: ${rejectionReason || "Invalid or unreadable receipt."}\n\nPlease log in to the mobile app and submit a valid payment receipt immediately to avoid penalties.\n\nThank you,\nIBT Management`;
            
            await sendEmail({ email: updatedTenant.email, subject, message });

            const user = await User.findOne({ email: updatedTenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Payment Rejected ", 
                    `Your renewal payment was rejected. Reason: ${rejectionReason}. Please submit a valid receipt.`,
                    { route: 'stalls' }
                );
            }
        } catch (emailErr) {
            console.error("Failed to send rejection email:", emailErr.message);
        }
    }

    res.status(200).json({ message: "Renewal rejected successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("Reject Renewal Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const resolveTemplateForOnboarding = ({ templates, defaultTemplateId, transferApplication }) => {
  const applicationTemplateId = transferApplication?.defaultTemplateId || "";
  const selectedTemplateId = applicationTemplateId || defaultTemplateId;
  if (!selectedTemplateId) return null;
  return templates.find((template) => String(template._id) === String(selectedTemplateId)) || null;
};