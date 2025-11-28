const express = require("express");
const router = express.Router();
const { 
  getBusTrips, 
  createBusTrip, 
  updateBusTrip, 
  deleteBusTrip 
} = require("../controllers/busTripController");

router.get("/", getBusTrips);
router.post("/", createBusTrip);
router.put("/:id", updateBusTrip);
router.delete("/:id", deleteBusTrip);

module.exports = router;