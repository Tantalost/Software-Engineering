import express from "express";
import { 
  getBusTrips, 
  createBusTrip, 
  updateBusTrip, 
  archiveBusTrip,       
  restoreBusTrip,       
  getArchivedBusTrips,
  deleteBusTrip,
  updateAllBusTripPrices,
  getDefaultBusPrice
} from "../controllers/busTripController.js"; 

const router = express.Router();

router.get("/", getBusTrips);
router.post("/", createBusTrip);
router.put("/:id", updateBusTrip);

router.get("/archived", getArchivedBusTrips); 
router.patch("/:id/archive", archiveBusTrip); 
router.patch("/:id/restore", restoreBusTrip);
router.delete("/:id", deleteBusTrip);

router.get("/default-price", getDefaultBusPrice);
router.put("/update-prices/all", updateAllBusTripPrices);


export default router;