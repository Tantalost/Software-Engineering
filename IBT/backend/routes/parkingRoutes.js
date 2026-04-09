import express from "express";
import {
  getParkingTickets, 
  createParking, 
  updateParking, 
  deleteParking, 
  departParking,
  archiveParking,
  restoreParking,
  getArchivedParkingTickets,
  submitParkingForShift,
} from "../controllers/parkingController.js";

const router = express.Router();

// Standard Routes
router.get("/", getParkingTickets);
router.post("/", createParking);
router.put("/submit-shift", submitParkingForShift);
router.put("/:id", updateParking);
router.put("/:id/depart", departParking);

// New Soft Delete Routes
router.get("/archived", getArchivedParkingTickets);
router.patch("/:id/archive", archiveParking);
router.patch("/:id/restore", restoreParking);

// Hard Delete Route
router.delete("/:id", deleteParking);

export default router;