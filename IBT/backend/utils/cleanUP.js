import cron from 'node-cron';
import mongoose from 'mongoose';
import TenantApplication from '../models/TenantApplication.js';
import BusTrip from '../models/BusTrips.js';
import Tenant from '../models/Tenant.js';
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

    console.log("Cron Job initialized: Database cleanup scheduled for midnight daily.");
};