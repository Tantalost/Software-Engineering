import cron from 'node-cron';
import mongoose from 'mongoose';
import TenantApplication from '../models/TenantApplication.js';
import BusTrip from '../models/BusTrips.js';


const ApplicationSchema = new mongoose.Schema({
    targetSlot: String,
    userId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Application = mongoose.model('Application', ApplicationSchema, 'applications');

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

    console.log("Cron Job initialized: Database cleanup scheduled for midnight daily.");
};