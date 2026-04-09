import express from "express";
import upload from "../middleware/upload.js";
import { 
    getLostFound, 
    createLostFound, 
    updateLostFound, 
    deleteLostFound,
    archiveLostFound,
    restoreLostFound,
    getArchivedLostFound,
    getLostFoundPhoto,
    submitLostFoundForShift,
} from "../controllers/lostfoundController.js";

const router = express.Router();

// Standard Routes
router.get("/", getLostFound);
router.post("/", upload.single("photo"), createLostFound);
router.put("/submit-shift", submitLostFoundForShift);
router.put("/:id", upload.single("evidencePhoto"), updateLostFound);
// New Soft Delete Routes
router.get("/archived", getArchivedLostFound);
router.patch("/:id/archive", archiveLostFound);
router.patch("/:id/restore", restoreLostFound);

// Hard Delete Route
router.delete("/:id", deleteLostFound);

// Serve stored item photos (admin UI can consume)
router.get("/photo/:filename", getLostFoundPhoto);

export default router;