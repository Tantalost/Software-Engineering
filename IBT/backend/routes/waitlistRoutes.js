import express from "express";
import { 
  getWaitlist, 
  getWaitlistByUid, 
  createWaitlistEntry, 
  updateWaitlistEntry 
} from "../controllers/waitlistController.js";

const router = express.Router();

router.get('/', getWaitlist);
router.get('/:uid', getWaitlistByUid);
router.post('/', createWaitlistEntry);
router.put('/:uid', updateWaitlistEntry);

export default router;