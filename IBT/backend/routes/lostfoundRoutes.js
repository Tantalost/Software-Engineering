import express from "express";
import { 
    getLostFound, 
    createLostFound, 
    updateLostFound, 
    deleteLostFound 
} from "../controllers/lostfoundController.js";

const router = express.Router();

router.get("/", getLostFound);
router.post("/", createLostFound);
router.put("/:id", updateLostFound);
router.delete("/:id", deleteLostFound);

export default router;