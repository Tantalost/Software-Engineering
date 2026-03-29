// utils/cronJobs.js
import cron from "node-cron";
import BusTrip from "../models/BusTrips.js";
import Company from "../models/Company.js";

// Runs every day at 00:01 AM
cron.schedule("1 0 * * *", async () => {
  console.log("Running Daily Bus Schedule Generator...");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date for exactly 7 days ago
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const startOfLastWeek = new Date(lastWeek.setHours(0, 0, 0, 0));
    const endOfLastWeek = new Date(lastWeek.setHours(23, 59, 59, 999));

    // Find all successful trips from exactly one week ago
    const historicalTrips = await BusTrip.find({
      date: { $gte: startOfLastWeek, $lte: endOfLastWeek },
      status: 'Departed' // Only copy trips that actually happened
    });

    if (historicalTrips.length === 0) {
      console.log("No historical data found for this day last week.");
      return;
    }

    // Pre-generate today's trips based on last week's successful trips
    const newTrips = historicalTrips.map(trip => ({
      templateNo: trip.templateNo,
      company: trip.company,
      route: trip.route,
      busType: trip.busType,
      stopType: trip.stopType || "Regular Trip",
      customStopCount: trip.stopType === "Other" ? trip.customStopCount || null : null,
      time: trip.time, // Same expected arrival time
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
    
    // Calculate the date exactly 7 days ago
    const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));

    // Find all trips older than 7 days that are completed
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