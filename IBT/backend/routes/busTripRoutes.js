import express from "express";
import { 
  getBusTrips, 
  getPredefinedTodayTrips,
  getDispatchBoardTrips,
  createBusTrip, 
  updateBusTrip, 
  archiveBusTrip,       
  restoreBusTrip,       
  getArchivedBusTrips,
  deleteBusTrip,
  updateAllBusTripPrices,
  getDefaultBusPrice,
  approveDeparture
} from "../controllers/busTripController.js"; 

const router = express.Router();

router.get("/", getBusTrips);
router.get("/predefined-today", getPredefinedTodayTrips);
router.get("/dispatch-board", getDispatchBoardTrips);
router.post("/", createBusTrip);
router.put("/:id", updateBusTrip);

router.get("/archived", getArchivedBusTrips); 
router.patch("/:id/archive", archiveBusTrip); 
router.patch("/:id/restore", restoreBusTrip);
router.delete("/:id", deleteBusTrip);

router.get("/default-price", getDefaultBusPrice);
router.put("/update-prices/all", updateAllBusTripPrices);
router.put("/:id/approve",approveDeparture);

export default router;