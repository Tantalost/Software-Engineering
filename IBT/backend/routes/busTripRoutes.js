import express from "express";
import { 
  getBusTrips, 
  createBusTrip, 
  updateBusTrip, 
  deleteBusTrip,
  updateAllBusTripPrices
} from "../controllers/busTripController.js"; 

const router = express.Router();

router.get("/", getBusTrips);
router.post("/", createBusTrip);
router.put("/:id", updateBusTrip);
router.put("/update-prices/all", updateAllBusTripPrices);
router.delete("/:id", deleteBusTrip);

export default router;