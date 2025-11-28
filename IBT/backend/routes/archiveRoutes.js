import express from "express";
import { getArchives, deleteArchive, restoreArchive, createArchive } from "../controllers/archiveController.js";

const router = express.Router();

router.get("/", getArchives);
router.delete("/:id", deleteArchive);
router.post("/restore/:id", restoreArchive);
router.post("/", createArchive);

export default router;