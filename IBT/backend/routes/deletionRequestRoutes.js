import express from "express";
import { getRequests, createRequest, handleRequest } from "../controllers/deletionRequestController.js";

const router = express.Router();

router.get("/", getRequests);
router.post("/", createRequest);
router.put("/:id", handleRequest); 

export default router;