// utils/cleanupJobs.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import TenantApplication from '../models/TenantApplication.js';

export const startCleanUP = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log("Running scheduled cleanup for rejected applications...");

        try {
           
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldRejections = await TenantApplication.find({
                status: 'REJECTED',
                updatedAt: { $lt: thirtyDaysAgo } 
            });

            if (oldRejections.length === 0) {
                console.log("No old rejected applications to clean up.");
                return;
            }

            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { 
                bucketName: 'uploads' 
            });

            let deletedCount = 0;

            for (const app of oldRejections) {
               
                const filesToDelete = [
                    app.permitUrl, 
                    app.validIdUrl, 
                    app.clearanceUrl, 
                    app.receiptUrl, 
                    app.contractUrl
                ].filter(Boolean); 

                for (const filename of filesToDelete) {
                    const files = await bucket.find({ filename }).toArray();
                    for (const file of files) {
                        await bucket.delete(file._id);
                    }
                }

                await TenantApplication.findByIdAndDelete(app._id);
                deletedCount++;
            }

            console.log(`Successfully cleaned up ${deletedCount} old rejected applications and their files.`);

        } catch (error) {
            console.error("Automated cleanup failed:", error);
        }
    });
};