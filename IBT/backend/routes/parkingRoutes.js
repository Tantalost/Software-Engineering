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
  getNextParkingTicketNumber
} from "../controllers/parkingController.js";

const router = express.Router();


router.get("/", getParkingTickets);
router.post("/", createParking);
router.put("/submit-shift", submitParkingForShift);
router.put("/:id", updateParking);
router.put("/:id/depart", departParking);
router.get("/next-ticket", getNextParkingTicketNumber);


router.get("/archived", getArchivedParkingTickets);
router.patch("/:id/archive", archiveParking);
router.patch("/:id/restore", restoreParking);


router.delete("/:id", deleteParking);

export default router;