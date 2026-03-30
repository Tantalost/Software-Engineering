// utils/cronJobs.js
import cron from "node-cron";
import BusTrip from "../models/BusTrips.js";
import Tenant from "../models/Tenant.js";


cron.schedule("1 0 * * *", async () => {
  console.log("Running Daily Bus Schedule Generator...");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const startOfLastWeek = new Date(lastWeek.setHours(0, 0, 0, 0));
    const endOfLastWeek = new Date(lastWeek.setHours(23, 59, 59, 999));

  
    const historicalTrips = await BusTrip.find({
      date: { $gte: startOfLastWeek, $lte: endOfLastWeek },
      status: 'Departed' 
    });

    if (historicalTrips.length === 0) {
      console.log("No historical data found for this day last week.");
      return;
    }


    const newTrips = historicalTrips.map(trip => ({
      templateNo: trip.templateNo,
      company: trip.company,
      route: trip.route,
      busType: trip.busType,
      stopType: trip.stopType || "Regular Trip",
      customStopCount: trip.stopType === "Other" ? trip.customStopCount || null : null,
      time: trip.time, 
      date: today,
      status: "Scheduled"
    }));

    await BusTrip.insertMany(newTrips);
    console.log(`Successfully auto-generated ${newTrips.length} trips for today!`);

  } catch (error) {
    console.error("Cron Job Error generating daily trips:", error);
  }
});

cron.schedule("0 1 * * *", async () => {
  console.log("Running Weekly Database Cleanup...");
  try {
    const today = new Date();
    
    const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));

    const result = await BusTrip.updateMany(
      { 
        date: { $lt: oneWeekAgo },
        status: { $in: ["Departed", "Paid"] },
        isArchived: false
      },
      { 
        $set: { isArchived: true } 
      }
    );

    console.log(`Successfully auto-archived ${result.modifiedCount} old bus trips.`);
  } catch (error) {
    console.error("Cron Job Error during auto-archiving:", error);
  }
});

cron.schedule("5 0 * * *", async () => {
  console.log("Running Monthly Overdue Penalty Script for Permanent Tenants...");
  try {
    const today = new Date();
    
    const overdueTenants = await Tenant.find({
      $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }],
      DueDateTime: { $lt: today },
      isArchived: false
    });

    let updatedCount = 0;

    for (const t of overdueTenants) {
      const rent = Number(t.rentAmount || 6000);
      const util = Number(t.utilityAmount || 0);
      const prevDueBalance = Number(t.totalAmount || rent);
      
      let accumulatedCharge = 0;
      let accumulatedInterest = 0;
      let finalTotal = 0;

      if (t.status !== "Overdue") {
         
          const n = rent + (rent * 0.25);
          const x = n * 0.02;
          const dueBalance = x + n;
          
          accumulatedCharge = rent * 0.25;
          accumulatedInterest = x;
          finalTotal = dueBalance + util;
      } else {
         
          const m = prevDueBalance + rent + (rent * 0.25);
          const y = m * 0.02;
          const updatedDueBalance = y + m;

          accumulatedCharge = (t.chargeAmount || 0) + (rent * 0.25);
          accumulatedInterest = (t.interestAmount || 0) + y;
          finalTotal = updatedDueBalance + util;
      }

      await Tenant.updateOne(
          { _id: t._id },
          { $set: { 
              status: "Overdue",
              chargeAmount: accumulatedCharge, 
              interestAmount: accumulatedInterest, 
              totalAmount: finalTotal 
          }}
      );
      updatedCount++;
    }

    console.log(`Successfully applied compounding penalties to ${updatedCount} overdue tenants.`);
  } catch (error) {
    console.error("Cron Job Error during tenant overdue processing:", error);
  }
});