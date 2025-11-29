import express from "express";
import {getParkingTickets, createParking, updateParking, deleteParking, departParking } from "../controllers/parkingController.js";

const router = express.Router();

router.get("/", getParkingTickets);
router.post("/", createParking);
router.put("/:id", updateParking);
router.put("/:id/depart", departParking);
router.delete("/:id", deleteParking);

export default router;