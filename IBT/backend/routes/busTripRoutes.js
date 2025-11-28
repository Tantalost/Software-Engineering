import express from "express";
import { 
  getBusTrips, 
  createBusTrip, 
  updateBusTrip, 
  deleteBusTrip 
} from "../controllers/busTripController.js"; 

const router = express.Router();

router.get("/", getBusTrips);
router.post("/", createBusTrip);
router.put("/:id", updateBusTrip);
router.delete("/:id", deleteBusTrip);

export default router;