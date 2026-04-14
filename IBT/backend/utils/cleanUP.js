import cron from 'node-cron';
import mongoose from 'mongoose';
import TenantApplication from '../models/TenantApplication.js';
import BusTrip from '../models/BusTrips.js';
import Tenant from '../models/Tenant.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import sendPushNotification from './sendPushNotification.js';
import sendEmail from './sendEmail.js';


const ApplicationSchema = new mongoose.Schema({
    targetSlot: String,
    userId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Application = mongoose.model('Application', ApplicationSchema, 'applications');

const startOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const daysUntil = (targetDate, fromDate = new Date()) => {
    const diff = startOfDay(targetDate).getTime() - startOfDay(fromDate).getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const addMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

const withDayInMonth = (baseDate, targetDay) => {
    const copy = new Date(baseDate);
    const safeDay = Math.max(1, toFiniteNumber(targetDay, 1));
    const daysInMonth = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
    copy.setDate(Math.min(safeDay, daysInMonth));
    return copy;
};

const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const getSlotCount = (slotNo) => {
    if (!slotNo) return 1;
    const count = String(slotNo)
        .split(',')
        .map((slot) => slot.trim())
        .filter(Boolean).length;
    return Math.max(1, count);
};

const getNextDueDate = ({ tenantType, fromDueDate, permanentDueDay }) => {
    const base = new Date(fromDueDate);
    if (tenantType === 'Night Market') {
        return addDays(base, 7);
    }

    return withDayInMonth(addMonths(base, 1), permanentDueDay);
};

const resolveNextCycleRent = ({ tenant, permanentBasePrice, nightBasePrice }) => {
    const slotCount = getSlotCount(tenant.slotNo);
    const isNightMarket = tenant.tenantType === 'Night Market';
    const basePrice = isNightMarket ? nightBasePrice : permanentBasePrice;
    const computed = toFiniteNumber(basePrice, 0) * slotCount;
    if (computed > 0) return computed;
    return Math.max(0, toFiniteNumber(tenant.rentAmount, 0));
};

const loadOverdueRuntimeConfig = async () => {
    const [
        permanentCharge,
        permanentInterest,
        nightCharge,
        nightInterest,
        permanentDueDate,
        permanentPrice,
        nightPrice,
    ] = await Promise.all([
        Settings.findOne({ key: 'permanentChargePercentage' }),
        Settings.findOne({ key: 'permanentInterestPercentage' }),
        Settings.findOne({ key: 'nightMarketChargePercentage' }),
        Settings.findOne({ key: 'nightMarketInterestPercentage' }),
        Settings.findOne({ key: 'permanentDueDate' }),
        Settings.findOne({ key: 'defaultPermanentPrice' }),
        Settings.findOne({ key: 'defaultNightPrice' }),
    ]);

    return {
        permanentChargePct: toFiniteNumber(permanentCharge?.value, 25),
        permanentInterestPct: toFiniteNumber(permanentInterest?.value, 2),
        nightChargePct: toFiniteNumber(nightCharge?.value, 25),
        nightInterestPct: toFiniteNumber(nightInterest?.value, 2),
        permanentDueDay: Math.max(1, Math.min(31, toFiniteNumber(permanentDueDate?.value, 5))),
        permanentBasePrice: toFiniteNumber(permanentPrice?.value, 6000),
        nightBasePrice: toFiniteNumber(nightPrice?.value, 150),
    };
};

export const processTenantOverdueLifecycle = async () => {
    if (mongoose.connection.readyState !== 1) {
        return {
            skipped: true,
            reason: 'db-not-connected',
            affectedTenants: 0,
            appliedCycles: 0,
        };
    }

    const config = await loadOverdueRuntimeConfig();
    const now = new Date();

    const dueTenants = await Tenant.find({
        isArchived: { $ne: true },
        status: { $nin: ['Moved Out', 'MOVED OUT'] },
        DueDateTime: { $lt: now },
    });

    let affectedTenants = 0;
    let appliedCycles = 0;

    for (const tenant of dueTenants) {
        const wasOverdue = String(tenant.status || '').toLowerCase() === 'overdue';
        const isNightMarket = tenant.tenantType === 'Night Market';
        const configuredChargePct = isNightMarket ? config.nightChargePct : config.permanentChargePct;
        const configuredInterestPct = isNightMarket ? config.nightInterestPct : config.permanentInterestPct;

        const appliedChargePct = wasOverdue && Number.isFinite(Number(tenant.overdueChargePercentage))
            ? Number(tenant.overdueChargePercentage)
            : configuredChargePct;
        const appliedInterestPct = wasOverdue && Number.isFinite(Number(tenant.overdueInterestPercentage))
            ? Number(tenant.overdueInterestPercentage)
            : configuredInterestPct;

        const utilityAmount = Math.max(0, toFiniteNumber(tenant.utilityAmount, 0));
        let dueWithoutUtility = wasOverdue
            ? Math.max(0, toFiniteNumber(tenant.totalAmount, 0) - utilityAmount)
            : 0;

        let runningCharge = wasOverdue ? Math.max(0, toFiniteNumber(tenant.chargeAmount, 0)) : 0;
        let runningInterest = wasOverdue ? Math.max(0, toFiniteNumber(tenant.interestAmount, 0)) : 0;
        let cycleRentAmount = Math.max(0, toFiniteNumber(tenant.rentAmount, 0));

        let dueCursor = new Date(tenant.DueDateTime);
        if (Number.isNaN(dueCursor.getTime())) {
            dueCursor = now;
        }

        let tenantCycleCount = 0;
        while (dueCursor < now && tenantCycleCount < 36) {
            const cycleCharge = cycleRentAmount * (appliedChargePct / 100);
            const newGrossRent = cycleRentAmount + cycleCharge;
            const compoundingBase = dueWithoutUtility + newGrossRent;
            const cycleInterest = compoundingBase * (appliedInterestPct / 100);

            dueWithoutUtility = compoundingBase + cycleInterest;
            runningCharge += cycleCharge;
            runningInterest += cycleInterest;
            tenantCycleCount += 1;

            dueCursor = getNextDueDate({
                tenantType: tenant.tenantType,
                fromDueDate: dueCursor,
                permanentDueDay: config.permanentDueDay,
            });

            cycleRentAmount = resolveNextCycleRent({
                tenant,
                permanentBasePrice: config.permanentBasePrice,
                nightBasePrice: config.nightBasePrice,
            });
        }

        if (tenantCycleCount === 0) {
            continue;
        }

        tenant.status = 'Overdue';
        tenant.overdueChargePercentage = appliedChargePct;
        tenant.overdueInterestPercentage = appliedInterestPct;
        tenant.overdueCycleCount = Math.max(0, toFiniteNumber(tenant.overdueCycleCount, 0)) + tenantCycleCount;
        tenant.lastOverdueAppliedAt = now;

        tenant.chargeAmount = runningCharge;
        tenant.interestAmount = runningInterest;
        tenant.totalAmount = dueWithoutUtility + utilityAmount;
        tenant.DueDateTime = dueCursor;
        tenant.rentAmount = cycleRentAmount;

        await tenant.save();

        affectedTenants += 1;
        appliedCycles += tenantCycleCount;
    }

    if (affectedTenants > 0) {
        console.log(`[OVERDUE CRON] Updated ${affectedTenants} tenant(s) across ${appliedCycles} overdue cycle(s).`);
    }

    return {
        skipped: false,
        affectedTenants,
        appliedCycles,
    };
};

export const processContractRenewalLifecycle = async () => {
    if (mongoose.connection.readyState !== 1) {
        return {
            skipped: true,
            reason: 'db-not-connected',
            eligibilityFlagged: 0,
            transitionsApplied: 0,
            eligibilityEmailsSent: 0,
        };
    }

    const tenants = await Tenant.find({
        isArchived: { $ne: true },
        contracts: { $exists: true, $ne: [] },
    });

    const today = new Date();
    let eligibilityFlagged = 0;
    let transitionsApplied = 0;
    let eligibilityEmailsSent = 0;

    for (const tenant of tenants) {
        const contracts = Array.isArray(tenant.contracts) ? tenant.contracts : [];
        if (contracts.length === 0) continue;

        const activeContract = tenant.activeContractId
            ? contracts.find((contract) => String(contract._id) === String(tenant.activeContractId))
            : (contracts.find((contract) => contract.status === 'active') || contracts[contracts.length - 1]);
        if (!activeContract?.endDate) continue;

        const awaitingContract = contracts.find(
            (contract) => contract.status === 'approved_awaiting_start' && contract.startDate && startOfDay(contract.startDate) <= startOfDay(today)
        );

        let touched = false;
        if (awaitingContract) {
            if (activeContract.status === 'active') {
                activeContract.status = 'expired';
            }
            awaitingContract.status = 'active';
            tenant.activeContractId = awaitingContract._id;
            tenant.StartDateTime = awaitingContract.startDate;
            tenant.DueDateTime = awaitingContract.endDate;
            tenant.documents = tenant.documents || {};
            if (awaitingContract.documentUrl) {
                tenant.documents.contract = awaitingContract.documentUrl;
            }
            tenant.isEligibleForRenewal = false;
            tenant.renewalEligibilityNotifiedAt = null;
            tenant.renewalEligibilityEmailNotifiedAt = null;
            touched = true;
            transitionsApplied += 1;

            if (tenant.email) {
                try {
                    const user = await User.findOne({ email: tenant.email });
                    if (user?.expoPushToken) {
                        await sendPushNotification(
                            user.expoPushToken,
                            'Renewal Activated',
                            `Your new renewal contract for Slot ${tenant.slotNo} is now active.`,
                            { route: 'stalls' },
                        );
                    }
                } catch (pushError) {
                    console.error('[RENEWAL CRON] transition push failed:', pushError.message);
                }
            }
        }

        const hasOpenRenewal = contracts.some((contract) => ['pending_approval', 'approved_awaiting_start'].includes(contract.status));
        const remainingDays = daysUntil(activeContract.endDate, today);
        const shouldFlagEligibility = remainingDays === 30 && !hasOpenRenewal;
        const shouldSendEligibilityEmail = shouldFlagEligibility && !tenant.renewalEligibilityEmailNotifiedAt;

        if (shouldFlagEligibility && !tenant.isEligibleForRenewal) {
            tenant.isEligibleForRenewal = true;
            tenant.renewalEligibilityNotifiedAt = new Date();
            touched = true;
            eligibilityFlagged += 1;

            if (tenant.email) {
                try {
                    const user = await User.findOne({ email: tenant.email });
                    if (user?.expoPushToken) {
                        await sendPushNotification(
                            user.expoPushToken,
                            'Renewal Available',
                            `Your contract for Slot ${tenant.slotNo} ends in 30 days. Submit your renewal contract in the app.`,
                            { route: 'stalls' },
                        );
                    }
                } catch (pushError) {
                    console.error('[RENEWAL CRON] eligibility push failed:', pushError.message);
                }
            }
        }

        if (shouldSendEligibilityEmail && tenant.email) {
            const tenantDisplayName = tenant.tenantName || tenant.name || 'Tenant';
            const subject = 'Contract Renewal Reminder - 1 Month Left';
            const message = `Dear ${tenantDisplayName},\n\nYour current contract for Slot ${tenant.slotNo} has 30 days remaining.\n\nTo avoid interruption, please submit your renewal contract request in the IBT mobile app as soon as possible.\n\nThank you,\nIBT Management`;

            try {
                await sendEmail({
                    email: tenant.email,
                    subject,
                    message,
                });

                tenant.renewalEligibilityEmailNotifiedAt = new Date();
                if (!tenant.renewalEligibilityNotifiedAt) {
                    tenant.renewalEligibilityNotifiedAt = new Date();
                }
                eligibilityEmailsSent += 1;
                touched = true;
            } catch (emailError) {
                console.error('[RENEWAL CRON] eligibility email failed:', emailError.message);
            }
        }

        if (touched) {
            await tenant.save();
        }
    }

    if (eligibilityFlagged > 0 || transitionsApplied > 0 || eligibilityEmailsSent > 0) {
        console.log(`[RENEWAL CRON] Flagged ${eligibilityFlagged} eligible tenant(s), transitioned ${transitionsApplied} contract(s), sent ${eligibilityEmailsSent} eligibility email(s).`);
    }

    return {
        skipped: false,
        eligibilityFlagged,
        transitionsApplied,
        eligibilityEmailsSent,
    };
};

const deleteGridFSFiles = async (bucket, filenames) => {
    const validFilenames = filenames.filter(Boolean);
    if (validFilenames.length === 0) return;

    for (const filename of validFilenames) {
        try {
            const files = await bucket.find({ filename }).toArray();
            for (const file of files) {
                await bucket.delete(file._id);
            }
        } catch (err) {
            console.error(`Failed to delete GridFS file ${filename}:`, err);
        }
    }
};

export const startCleanUP = () => {
  
    cron.schedule('0 0 * * *', async () => {
        console.log(`[${new Date().toLocaleString()}] Starting nightly database cleanup...`);

     
        if (mongoose.connection.readyState !== 1) {
            console.log("Database not fully connected. Skipping cleanup.");
            return;
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { 
            bucketName: 'uploads' 
        });

        try {
           
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldRejections = await TenantApplication.find({
                status: 'REJECTED',
                updatedAt: { $lt: thirtyDaysAgo } 
            });

            let rejectedDeletedCount = 0;

            for (const app of oldRejections) {
               
                await deleteGridFSFiles(bucket, [
                    app.permitUrl, 
                    app.validIdUrl, 
                    app.clearanceUrl, 
                    app.receiptUrl, 
                    app.contractUrl,
                    app.communityTaxUrl,
                    app.policeClearanceUrl
                ]);

                await TenantApplication.findByIdAndDelete(app._id);
                rejectedDeletedCount++;
            }

            if (rejectedDeletedCount > 0) {
                console.log(`[CLEANUP] Success: Removed ${rejectedDeletedCount} old rejected applications and their files.`);
            }

            const ghostEntries = await Application.find({
                $or: [
                    { targetSlot: { $exists: false } },
                    { targetSlot: "" },
                    { userId: { $exists: false } }
                ]
            });

            let ghostDeletedCount = 0;

            for (const ghost of ghostEntries) {
               
                await deleteGridFSFiles(bucket, [
                    ghost.permitUrl, 
                    ghost.validIdUrl, 
                    ghost.clearanceUrl, 
                    ghost.receiptUrl, 
                    ghost.contractUrl,
                    ghost.communityTaxUrl,
                    ghost.policeClearanceUrl
                ]);

                await Application.findByIdAndDelete(ghost._id);
                ghostDeletedCount++;
            }

            if (ghostDeletedCount > 0) {
                console.log(`[CLEANUP] Success: Removed ${ghostDeletedCount} ghost entries and their orphaned files.`);
            } else {
                console.log(`[CLEANUP] Database is healthy. No ghost entries found.`);
            }

        } catch (error) {
            console.error("[CLEANUP ERROR]:", error);
        }
    });

    // Bus dispatch failsafe: auto-clear stale active buses older than 48 hours.
    cron.schedule('15 0 * * *', async () => {
        if (mongoose.connection.readyState !== 1) return;
        try {
            const cutoff = new Date(Date.now() - (48 * 60 * 60 * 1000));
            const result = await BusTrip.updateMany(
                {
                    isArchived: { $ne: true },
                    status: { $in: ["Arrived", "On Fix", "Not Departed"] },
                    $or: [
                        { arrivalLoggedAt: { $lt: cutoff } },
                        { arrivalLoggedAt: null, date: { $lt: cutoff } },
                    ],
                },
                {
                    $set: {
                        status: "System Auto-Cleared",
                        isArchived: true,
                    },
                },
            );
            if (result.modifiedCount > 0) {
                console.log(`[CLEANUP] Auto-cleared ${result.modifiedCount} stale active bus trips.`);
            }
        } catch (error) {
            console.error("[BUS AUTO-CLEAR ERROR]:", error);
        }
    });

    cron.schedule('2 0 * * *', async () => {
        try {
            await processContractRenewalLifecycle();
        } catch (error) {
            console.error('[RENEWAL CRON ERROR]:', error);
        }
    });

    cron.schedule('3 0 * * *', async () => {
        try {
            await processTenantOverdueLifecycle();
        } catch (error) {
            console.error('[OVERDUE CRON ERROR]:', error);
        }
    });

    console.log("Cron Job initialized: Database cleanup scheduled for midnight daily.");
};