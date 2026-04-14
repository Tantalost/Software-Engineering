import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Settings from '../models/Settings.js';
import Notification from '../models/Notification.js'; 
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import path from 'path';

const SECRET_KEY = process.env.ENCRYPTION_KEY || " "; 
const CONTRACT_TEMPLATES_KEY = "tenantContractTemplates";
const DEFAULT_CONTRACT_TEMPLATE_KEY = "tenantDefaultContractTemplateId";

const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const addMonths = (date, months) => {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
};

const withDayInMonth = (baseDate, targetDay) => {
    const copy = new Date(baseDate);
    const safeDay = Math.max(1, Number(targetDay) || 1);
    const daysInMonth = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
    copy.setDate(Math.min(safeDay, daysInMonth));
    return copy;
};

const toValidDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value) => {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const daysUntil = (targetDate, fromDate = new Date()) => {
    const diff = startOfDay(targetDate).getTime() - startOfDay(fromDate).getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const isPausedForExtendedNonPayment = (tenant) => {
    if (!tenant?.isOperationPaused) return false;

    const pauseReason = String(tenant.operationPauseReason || '').toUpperCase();
    if (pauseReason === 'NON_PAYMENT_2_MONTHS') return true;

    const status = String(tenant.status || '').toLowerCase();
    const overdueCycles = Number(tenant.overdueCycleCount || 0);
    return status === 'overdue' && overdueCycles >= 2;
};

const splitDuration = (durationMonths) => ({
    years: Math.floor(durationMonths / 12),
    months: durationMonths % 12,
});

const normalizeContractTemplates = (rawValue) => {
    if (!Array.isArray(rawValue)) return [];
    return rawValue.filter((item) => item && item._id);
};

const fetchTemplateState = async () => {
    const [templatesSetting, defaultSetting] = await Promise.all([
        Settings.findOne({ key: CONTRACT_TEMPLATES_KEY }),
        Settings.findOne({ key: DEFAULT_CONTRACT_TEMPLATE_KEY }),
    ]);

    return {
        templates: normalizeContractTemplates(templatesSetting?.value),
        defaultTemplateId: typeof defaultSetting?.value === 'string' ? defaultSetting.value : '',
    };
};

const getActiveContract = (tenant) => {
    const contracts = Array.isArray(tenant.contracts) ? tenant.contracts : [];
    if (contracts.length === 0) return null;

    const byId = tenant.activeContractId
        ? contracts.find((contract) => String(contract._id) === String(tenant.activeContractId))
        : null;
    const byStatus = contracts.find((contract) => contract.status === 'active');
    return byId || byStatus || contracts[contracts.length - 1];
};

const resolvePermanentDueDate = (tenant, permanentDueDay) => {
    const paymentHistory = Array.isArray(tenant.paymentHistory) ? tenant.paymentHistory : [];
    const operationStartDate = toValidDate(tenant.operationStartDate);
    const billingStartDate = operationStartDate ? addDays(operationStartDate, 1) : null;

    // Permanent billing should not start until operations are officially started.
    if (!billingStartDate) {
        return null;
    }

    const nonInitialPayments = paymentHistory.filter((entry) => {
        const ref = String(entry.referenceNo || '').trim().toLowerCase();
        return ref !== 'initial payment';
    });

    const currentDue = toValidDate(tenant.DueDateTime);
    if (currentDue && currentDue >= billingStartDate) {
        return currentDue;
    }

    const coverageCandidates = nonInitialPayments
        .map((entry) => toValidDate(entry.coverageEndDate))
        .filter(Boolean)
        .filter((date) => !billingStartDate || date >= billingStartDate)
        .sort((a, b) => b.getTime() - a.getTime());

    if (coverageCandidates.length > 0) {
        return coverageCandidates[0];
    }

    const latestPaidAt = nonInitialPayments
        .map((entry) => toValidDate(entry.datePaid))
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const anchorDate = latestPaidAt
        || billingStartDate
        || toValidDate(tenant.StartDateTime);

    if (!anchorDate) return null;

    const firstCandidate = withDayInMonth(anchorDate, permanentDueDay);
    if (firstCandidate >= anchorDate) return firstCandidate;
    return withDayInMonth(addMonths(anchorDate, 1), permanentDueDay);
};

const resolveNextBillingDueDate = (tenant, activeContract, permanentDueDay = 5) => {
    const isNightMarket = tenant.tenantType === 'Night Market';

    if (!isNightMarket) {
        const permanentDue = resolvePermanentDueDate(tenant, permanentDueDay);
        const contractEndDate = toValidDate(activeContract?.endDate) || toValidDate(tenant.DueDateTime);
        if (permanentDue && contractEndDate && permanentDue > contractEndDate) {
            return contractEndDate;
        }
        return permanentDue;
    }

    const paymentHistory = Array.isArray(tenant.paymentHistory) ? tenant.paymentHistory : [];

    let dueCandidate = null;

    if (paymentHistory.length > 0) {
        const latestCoverageEndDate = paymentHistory
            .map((entry) => toValidDate(entry.coverageEndDate))
            .filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;

        if (latestCoverageEndDate) {
            dueCandidate = latestCoverageEndDate;
        } else {
            const latestPaymentDate = paymentHistory
                .map((entry) => toValidDate(entry.datePaid))
                .filter(Boolean)
                .sort((a, b) => b.getTime() - a.getTime())[0] || null;

            if (latestPaymentDate) {
                dueCandidate = isNightMarket
                    ? addDays(latestPaymentDate, 7)
                    : addMonths(latestPaymentDate, 1);
            }
        }
    }

    if (!dueCandidate) {
        const cycleStart = toValidDate(activeContract?.startDate) || toValidDate(tenant.StartDateTime);
        if (cycleStart) {
            dueCandidate = isNightMarket
                ? addDays(cycleStart, 7)
                : addMonths(cycleStart, 1);
        }
    }

    const contractEndDate = toValidDate(activeContract?.endDate) || toValidDate(tenant.DueDateTime);
    if (dueCandidate && contractEndDate && dueCandidate > contractEndDate) {
        return contractEndDate;
    }

    return dueCandidate || contractEndDate;
};

const detectMimeTypeFromBuffer = (buffer) => {
    if (!buffer || buffer.length < 4) return null;

    if (buffer.slice(0, 4).toString() === '%PDF') return 'application/pdf';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
    ) return 'image/png';
    if (buffer.slice(0, 3).toString() === 'GIF') return 'image/gif';
    if (
        buffer.slice(0, 4).toString() === 'RIFF' &&
        buffer.slice(8, 12).toString() === 'WEBP'
    ) return 'image/webp';

    return null;
};

const createAdminNotification = async (title, message) => {
  try {
    const newNote = new Notification({
      title,
      message,
      source: "System",
      targetRole: "superadmin", 
      date: new Date().toISOString().split('T')[0]
    });
    await newNote.save();
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

export const getSecureDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { 
            bucketName: 'uploads' 
        });

        const cursor = bucket.find({ filename: filename });
        const files = await cursor.toArray();
        if (!files.length) return res.status(404).send("File not found");
        const fileMeta = files[0] || {};

        const downloadStream = bucket.openDownloadStreamByName(filename);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', () => res.status(500).send("Stream Error"));
        
        downloadStream.on('end', () => {
            const fileBufferRaw = Buffer.concat(chunks);
            
            const header = fileBufferRaw.toString('utf8', 0, 8);
            const isEncrypted = header === 'U2FsdGVk'; 
            
            let finalBuffer;
            if (isEncrypted) {
                try {
                                        const encryptedPayload = fileBufferRaw.toString('utf8');
                                        const candidateKeys = [
                                            SECRET_KEY,
                                            process.env.LEGACY_ENCRYPTION_KEY,
                                            " "
                                        ].filter((value, index, arr) => value && arr.indexOf(value) === index);

                                        let originalBase64 = "";

                                        for (const key of candidateKeys) {
                                            try {
                                                const bytes = CryptoJS.AES.decrypt(encryptedPayload, key);
                                                const attempt = bytes.toString(CryptoJS.enc.Utf8);
                                                if (attempt) {
                                                    originalBase64 = attempt;
                                                    break;
                                                }
                                            } catch (_) {
                                                continue;
                                            }
                                        }

                                        if (!originalBase64) {
                                            return res.status(422).send("Unable to decrypt file");
                                        }

                                        finalBuffer = Buffer.from(originalBase64, 'base64');
                                } catch (e) { return res.status(500).send("Decryption Failed"); }
            } else {
                finalBuffer = fileBufferRaw;
            }

                        const ext = path.extname(filename).toLowerCase();
                        let contentType = detectMimeTypeFromBuffer(finalBuffer) || fileMeta.contentType || 'application/octet-stream';
                        if (contentType === 'application/octet-stream') {
                            if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
                            if (['.png'].includes(ext)) contentType = 'image/png';
                            if (['.pdf'].includes(ext)) contentType = 'application/pdf';
                            if (['.webp'].includes(ext)) contentType = 'image/webp';
                            if (['.gif'].includes(ext)) contentType = 'image/gif';
                        }

            res.setHeader('Content-Type', contentType);
                        res.setHeader('Content-Disposition', 'inline');
            res.send(finalBuffer);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


export const getOccupiedStalls = async (req, res) => {
   try {
        const { floor } = req.query; 
        
        const tenants = await Tenant.find({ 
            tenantType: floor, 
            isArchived: { $ne: true } 
        });
        
        let occupiedLabels = [];
        tenants.forEach(t => {
          if (t.slotNo) {
            const slots = t.slotNo.split(',').map(s => s.trim());
            occupiedLabels.push(...slots);
          }
        });
        res.json(occupiedLabels);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const getPendingStalls = async (req, res) => {
  try {
    const { floor } = req.query; 
    const activeStatuses = ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'];
    const pendingApps = await TenantApplication.find({ floor: floor, status: { $in: activeStatuses } }).select('targetSlot'); 
    
    
    let pendingLabels = [];
    pendingApps.forEach(app => {
        if (app.targetSlot) {
            const slots = app.targetSlot.split(',').map(s => s.trim());
            pendingLabels.push(...slots);
        }
    });
    res.json(pendingLabels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplication = async (req, res) => {
    try {
        const tokenUserId = String(req.user?.id || '').trim();
        const paramUserId = String(req.params?.userId || '').trim();
        const userId = tokenUserId || paramUserId;

        const parseSlotLabels = (value) => String(value || '')
            .split(',')
            .map((slot) => slot.trim())
            .filter(Boolean);

        const hasSlotOverlap = (left, rightSet) => {
            const leftSlots = parseSlotLabels(left);
            return leftSlots.some((slot) => rightSet.has(slot));
        };

        if (!userId) {
            return res.status(400).json({ message: 'Missing user identifier.' });
        }
        
        let applications = await TenantApplication.find({ userId }).lean();

        const tenants = await Tenant.find({
            isArchived: { $ne: true },
            uid: userId,
        }).lean();

        const tenantSlotSet = new Set(
            tenants.flatMap((tenant) => parseSlotLabels(tenant.slotNo))
        );

        let combinedApps = applications.filter(app => {
            if (app.status === 'TENANT') {
                return hasSlotOverlap(app.targetSlot, tenantSlotSet);
            }
            return true;
        });
        
        const nightSetting = await Settings.findOne({ key: "defaultNightPrice" });
        const nightWeeklySetting = await Settings.findOne({ key: "nightMarketWeeklyRent" });
        const permSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
        const dueDateSetting = await Settings.findOne({ key: "permanentDueDate" });
        const nightMaxTerminationSetting = await Settings.findOne({ key: "nightMarketMaxTerminationDays" });
        const globalNightPrice = nightSetting ? Number(nightSetting.value) : 150;
        const globalNightWeeklyRent = nightWeeklySetting ? Number(nightWeeklySetting.value) : (globalNightPrice * 7);
        const globalPermPrice = permSetting ? Number(permSetting.value) : 6000;
        const permanentDueDay = dueDateSetting ? Number(dueDateSetting.value) : 5;
        const nightMarketMaxTerminationDays = nightMaxTerminationSetting
            ? Math.max(1, Math.floor(Number(nightMaxTerminationSetting.value) || 0))
            : 3;
        const templateState = await fetchTemplateState();
        const renewalTemplates = templateState.templates.map((template) => ({
            _id: template._id,
            name: template.name || "Contract Template",
            contractType: template.contractType || "RENEWAL",
            durationMonths: Number(template.durationMonths || 0),
            duration: template.duration || splitDuration(Number(template.durationMonths || 0)),
        }));
                
        tenants.forEach(tenant => {
            const tenantSlots = new Set(parseSlotLabels(tenant.slotNo));
            const existingAppIndex = combinedApps.findIndex(app => hasSlotOverlap(app.targetSlot, tenantSlots));
            const slotCount = tenant.slotNo ? tenant.slotNo.split(',').length : 1;
            const isNightMarket = tenant.tenantType === 'Night Market';
            const isPermanent = !isNightMarket;
            const hasStartedOperation = Boolean(toValidDate(tenant.operationStartDate));
            const isBlockedByExtendedNonPayment = isPausedForExtendedNonPayment(tenant);
            const isWaitingForStartOperation = !hasStartedOperation;
            const activeContract = isNightMarket ? null : getActiveContract(tenant);
            const tenantContracts = isNightMarket ? [] : (Array.isArray(tenant.contracts) ? tenant.contracts : []);
            const pendingRenewalContract = isNightMarket
                ? null
                : tenantContracts.find((contract) => contract.status === 'pending_approval');
            const activeContractEndDate = isNightMarket ? null : toValidDate(activeContract?.endDate);
            const renewalDaysLeft = activeContractEndDate ? daysUntil(activeContractEndDate) : null;
            const isWithinRenewalWindow = renewalDaysLeft !== null && renewalDaysLeft >= 0 && renewalDaysLeft <= 30;
            const nightMarketTerminationAt = isNightMarket ? toValidDate(tenant.nightMarketTerminationAt) : null;
            const nightMarketTerminationDaysLeft = nightMarketTerminationAt ? daysUntil(nightMarketTerminationAt) : null;
            
           
            let calcRent = tenant.rentAmount;
            if (!calcRent || calcRent === 0) {
                calcRent = isNightMarket ? (globalNightWeeklyRent * slotCount) : (globalPermPrice * slotCount);
            }

            if (isWaitingForStartOperation) {
                calcRent = 0;
            }
            
            const calcUtil = tenant.utilityAmount || 0;
            let calcTotal = (tenant.totalAmount && tenant.totalAmount > 0) ? tenant.totalAmount : (calcRent + calcUtil);
            if (isWaitingForStartOperation) {
                calcTotal = 0;
            }

            const calcDueDate = resolveNextBillingDueDate(tenant, activeContract, permanentDueDay);
            const calcDue = (isWaitingForStartOperation || (isPermanent && isBlockedByExtendedNonPayment))
                ? null
                : (calcDueDate ? calcDueDate.toISOString() : null);

            const effectiveTenantStatus = (isWaitingForStartOperation || (isPermanent && isBlockedByExtendedNonPayment))
                ? 'Not Started Operations'
                : tenant.status;
            
            const tenantData = {
                status: 'TENANT', 
                tenantDbStatus: effectiveTenantStatus,
                start: tenant.StartDateTime,
                operationStartDate: tenant.operationStartDate || null,
                isOperationPaused: Boolean(tenant.isOperationPaused),
                operationPauseReason: tenant.operationPauseReason || null,
                overdueCycleCount: Number(tenant.overdueCycleCount || 0),
                nightMarketTerminationAt: nightMarketTerminationAt ? nightMarketTerminationAt.toISOString() : null,
                nightMarketTerminationDaysLeft,
                nightMarketMaxTerminationDays,
                nightMarketBasePrice: globalNightPrice,
                nightMarketWeeklyRent: globalNightWeeklyRent,
                due: calcDue,
                rentAmount: calcRent,
                utilityAmount: calcUtil,
                totalAmount: calcTotal,
                feeBreakdown: tenant.feeBreakdown,
                tenantId: tenant._id,

                paymentHistory: tenant.paymentHistory || [], 
                paymentReference: tenant.referenceNo, 
                paymentAmount: calcTotal,
                receiptUrl: tenant.documents?.proofOfReceipt || "",
   
                permitUrl: tenant.documents?.businessPermit || "",
                validIdUrl: tenant.documents?.validID || "",
                contractUrl: isNightMarket ? "" : (tenant.documents?.contract || ""),
                communityTaxUrl: tenant.documents?.communityTax || "", 
                policeClearanceUrl: tenant.documents?.policeClearance || "",
                contracts: tenantContracts,
                activeContractId: isNightMarket ? null : (tenant.activeContractId || null),
                activeContract,
                activeContractEndDate: isNightMarket ? null : (activeContractEndDate || null),
                isEligibleForRenewal: isNightMarket ? false : (!pendingRenewalContract && isWithinRenewalWindow),
                hasPendingRenewal: Boolean(pendingRenewalContract),
                pendingRenewalContract: pendingRenewalContract || null,
                renewalTemplates: isNightMarket ? [] : renewalTemplates,
                userId: tenant.uid || userId,
            };

            if (existingAppIndex >= 0) {
                combinedApps[existingAppIndex] = { ...combinedApps[existingAppIndex], ...tenantData };
            } else {
                combinedApps.push({ ...tenantData, targetSlot: tenant.slotNo, floor: tenant.tenantType });
            }
        });
        
        res.json(combinedApps); 
      } catch (error) { res.status(500).json({ message: error.message }); }
};

export const submitApplication = async (req, res) => {
    try {
        const data = req.body; 
        const files = req.files;
        const { templates, defaultTemplateId } = await fetchTemplateState();
        const defaultTemplate = templates.find((template) => String(template._id) === String(defaultTemplateId)) || null;

        if (files) {
            if (files.permit?.[0]) data.permitUrl = files.permit[0].filename;
            if (files.validId?.[0]) data.validIdUrl = files.validId[0].filename;
            if (files.clearance?.[0]) data.clearanceUrl = files.clearance[0].filename;
            if (files.communityTax?.[0]) data.communityTaxUrl = files.communityTax[0].filename;
            if (files.policeClearance?.[0]) data.policeClearanceUrl = files.policeClearance[0].filename;
        }

        const existingTenant = await Tenant.findOne({ 
          slotNo: { $regex: new RegExp(`\\b${data.targetSlot}\\b`, 'i') },
          isArchived: { $ne: true } 
        });

        if (existingTenant) return res.status(400).json({ message: "Sorry, this slot was just taken by another user." });
        
        const pendingApp = await TenantApplication.findOne({ 
            targetSlot: data.targetSlot, 
            status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'] } 
        });
        
        if (pendingApp) return res.status(400).json({ message: "Someone else is currently applying for this slot." });
        
        const newApp = await TenantApplication.findOneAndUpdate(
            { userId: data.userId, targetSlot: data.targetSlot }, 
            {
                ...data,
                status: 'VERIFICATION_PENDING',
                adminViewed: false,
                defaultTemplateId: defaultTemplate?._id || defaultTemplateId || "",
                defaultContractDurationMonths: Number(defaultTemplate?.durationMonths || 0),
                defaultContractType: defaultTemplate?.contractType || 'INITIAL',
            },
            { new: true, upsert: true }
        );

        await createAdminNotification("New Application Received", `Applicant ${data.name} has applied for slot ${data.targetSlot}.`);
        res.json(newApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const submitPayment = async (req, res) => {
    try {
        const { userId, targetSlot, paymentReference, paymentAmount } = req.body;

        if (!paymentReference || paymentReference.trim() === "") {
            return res.status(400).json({ message: "A valid Reference / OR Number is required." });
        }

        const duplicateApp = await TenantApplication.findOne({
            paymentReference: paymentReference,
            $or: [{ userId: { $ne: userId } }, { targetSlot: { $ne: targetSlot } }] 
        });

        if (duplicateApp) {
            return res.status(400).json({ message: "This Reference / OR Number is already used in another application." });
        }

        const duplicateTenant = await Tenant.findOne({
            $or: [
                { referenceNo: paymentReference },
                { "paymentHistory.referenceNo": paymentReference }
            ]
        });

        if (duplicateTenant) {
            return res.status(400).json({ message: "This Reference / OR Number has already been used for a lease payment." });
        }

        let receiptUrl = "";
        if (req.file) { receiptUrl = req.file.filename; } else if (req.body.receiptUrl) { receiptUrl = req.body.receiptUrl; }
        if (!receiptUrl) return res.status(400).json({ message: "Receipt file is missing." });
        
        const updatedApp = await TenantApplication.findOneAndUpdate(
            { userId: userId, targetSlot: targetSlot }, 
            { receiptUrl, paymentReference, paymentAmount, status: 'PAYMENT_REVIEW', paymentSubmittedAt: new Date(), adminViewed: false },
            { new: true }
        );
        
        await createAdminNotification("Payment Receipt Uploaded", `Ref: ${paymentReference}. Verify payment for Applicant ID: ${userId.slice(-6)}.`);
        res.json(updatedApp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const uploadContract = async (req, res) => {
    try {
       
        const { userId, targetSlot } = req.body;
        
        let contractUrl = "";
        if (req.file) contractUrl = req.file.filename;
        if (!userId || !targetSlot || !contractUrl) return res.status(400).json({ message: "Missing userId, targetSlot, or contract file" });

                const application = await TenantApplication.findOne({ userId, targetSlot });
                if (!application) return res.status(404).json({ message: "Application not found" });

                const applicantType = application.floor || application.tenantType;
                if (applicantType === 'Night Market') {
                        return res.status(400).json({ message: "Night Market applicants do not need signed contracts." });
                }
        
        
                application.contractUrl = contractUrl;
                application.status = 'CONTRACT_REVIEW';
                application.contractSubmittedAt = new Date();
                application.adminViewed = false;
                const updatedApp = await application.save();
        
        await createAdminNotification("Contract Signed", "A new signed contract has been uploaded.");
        res.json(updatedApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const submitRenewalContractRequest = async (req, res) => {
    try {
        const { tenantId, templateId } = req.body;
        const contractUrl = req.file?.filename || req.body.contractUrl || "";

        if (!tenantId) return res.status(400).json({ message: "Tenant ID is required." });
        if (!templateId) return res.status(400).json({ message: "Template selection is required." });
        if (!contractUrl) return res.status(400).json({ message: "Signed renewal contract file is required." });

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) return res.status(404).json({ message: "Tenant not found." });

        if (tenant.tenantType === 'Night Market') {
            return res.status(400).json({ message: "Night Market tenants do not use contract renewals." });
        }

        const activeContract = getActiveContract(tenant);
        if (!activeContract) {
            return res.status(400).json({ message: "No active contract was found for this tenant." });
        }

        const hasOpenRenewal = (Array.isArray(tenant.contracts) ? tenant.contracts : []).some((contract) =>
            ['pending_approval', 'approved_awaiting_start'].includes(contract.status)
        );
        if (hasOpenRenewal) {
            return res.status(400).json({ message: "A renewal request is already in progress for this tenant." });
        }

        const remainingDays = daysUntil(activeContract.endDate);
        if (remainingDays < 0) {
            return res.status(400).json({ message: "This contract has already ended. Please contact the admin office for assistance." });
        }
        if (remainingDays > 30) {
            return res.status(400).json({ message: "Renewal submission is allowed only when your contract has 30 days left or less." });
        }

        const { templates } = await fetchTemplateState();
        const selectedTemplate = templates.find((template) => String(template._id) === String(templateId));
        if (!selectedTemplate) {
            return res.status(404).json({ message: "Selected template was not found." });
        }

        const durationMonths = Math.max(Number(selectedTemplate.durationMonths || 0), 1);
        const startDate = addDays(new Date(activeContract.endDate), 1);
        const endDate = addMonths(startDate, durationMonths);

        tenant.contracts.push({
            contractType: 'RENEWAL',
            startDate,
            endDate,
            durationMonths,
            duration: splitDuration(durationMonths),
            documentUrl: contractUrl,
            status: 'pending_approval',
            source: 'tenant',
            assignedAt: new Date(),
            requestedAt: new Date(),
            templateId: selectedTemplate._id,
            templateName: selectedTemplate.name || 'Renewal Template',
            notes: `Submitted from mobile renewal flow for Slot ${tenant.slotNo}.`,
        });

        tenant.isEligibleForRenewal = false;
        await tenant.save();

        await createAdminNotification(
            "Renewal Contract Submitted",
            `${tenant.tenantName || tenant.name} submitted a renewal contract for Slot ${tenant.slotNo}.`
        );

        return res.status(200).json({
            message: "Renewal contract submitted for admin review.",
            tenant,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const submitRenewalPayment = async (req, res) => {
    try {
        const { tenantId, paymentReference } = req.body;
        
        if (!paymentReference || paymentReference.trim() === "") {
            return res.status(400).json({ message: "A valid Reference / OR Number is required." });
        }

        const duplicateApp = await TenantApplication.findOne({
            paymentReference: paymentReference
        });

        if (duplicateApp) {
            return res.status(400).json({ message: "This Reference / OR Number is already used in a pending application." });
        }

        const duplicateTenant = await Tenant.findOne({
            $or: [
                { referenceNo: paymentReference, _id: { $ne: tenantId } },
                { "paymentHistory.referenceNo": paymentReference }
            ]
        });

        if (duplicateTenant) {
            return res.status(400).json({ message: "This Reference / OR Number has already been used in a previous transaction." });
        }

        let receiptUrl = "";
        if (req.file) { receiptUrl = req.file.filename; } 
        else if (req.body.receiptUrl) { receiptUrl = req.body.receiptUrl; }
        
        if (!receiptUrl) return res.status(400).json({ message: "Receipt file is missing." });
        if (!tenantId) return res.status(400).json({ message: "Tenant ID is missing." });

        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            { 
                status: "Payment Review", 
                referenceNo: paymentReference,
                "documents.proofOfReceipt": receiptUrl
            },
            { new: true }
        );

        await createAdminNotification("Renewal Payment Uploaded", `Ref: ${paymentReference}. Verify renewal payment for Slot ${updatedTenant.slotNo}.`);
        res.json(updatedTenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};