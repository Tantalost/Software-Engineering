import cron from 'node-cron';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import SetPriceSettings from '../models/Settings.js';
import sendEmail from './sendEmail.js'; 

export const startOverdueCheck = () => {
   
    cron.schedule('1 0 * * *', async () => {
        console.log(`[${new Date().toLocaleString()}] Starting nightly Overdue Check...`);

        if (mongoose.connection.readyState !== 1) {
            console.log("Database not connected. Skipping overdue check.");
            return;
        }

        try {
          
            const chargeSetting = await SetPriceSettings.findOne({ key: "defaultChargePercentage" });
            const interestSetting = await SetPriceSettings.findOne({ key: "defaultInterestPercentage" });

            const cPct = chargeSetting ? Number(chargeSetting.value) : 25; 
            const iPct = interestSetting ? Number(interestSetting.value) : 2;  

          
            const now = new Date();
            const pendingOverdue = await Tenant.find({
                status: { $ne: "Overdue" }, 
                DueDateTime: { $lt: now },
                isArchived: { $ne: true }
            });

            let markedCount = 0;

            for (const tenant of pendingOverdue) {
               
                const rent = tenant.rentAmount || 0;
                const chargeAmt = rent * (cPct / 100);
                const dueBalance = rent + chargeAmt;
                const interestAmt = dueBalance * (iPct / 100);
                const totalAmt = rent + (tenant.utilityAmount || 0) + chargeAmt + interestAmt;

                tenant.status = "Overdue";
                tenant.chargeAmount = chargeAmt;
                tenant.interestAmount = interestAmt;
                tenant.totalAmount = totalAmt;

                await tenant.save();
                markedCount++;

                if (tenant.email) {
                    try {
                        await sendEmail({
                            email: tenant.email,
                            subject: "Notice: Rent Overdue",
                            message: `Dear ${tenant.tenantName || tenant.name},\n\nYour rent for Slot ${tenant.slotNo} is now overdue. A penalty charge of ${cPct}% and an interest fee of ${iPct}% have been applied to your account. Your new total due is ₱${totalAmt.toLocaleString()}.\n\nPlease settle this account immediately.\n\nThank you.`
                        });
                    } catch (e) {
                        console.error(`Failed to send overdue email to ${tenant.email}`);
                    }
                }
            }

            if (markedCount > 0) {
                console.log(`[OVERDUE CHECK] Success: Marked ${markedCount} tenants as Overdue and applied penalties.`);
            } else {
                console.log(`[OVERDUE CHECK] Database is healthy. No new overdue tenants today.`);
            }

        } catch (error) {
            console.error("[OVERDUE CHECK ERROR]:", error);
        }
    });

    console.log("Cron Job initialized: Overdue check scheduled for 12:01 AM daily.");
};