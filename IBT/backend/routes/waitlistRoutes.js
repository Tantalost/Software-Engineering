import express from "express";
import { 
  getWaitlist, 
  getWaitlistById, 
  createWaitlistEntry, 
  updateWaitlistEntry,
  deleteWaitlistEntry,
  getSecureDocument 
} from "../controllers/waitlistController.js";

const router = express.Router();

router.get('/doc/:filename', getSecureDocument);

router.get('/', getWaitlist);
router.get('/:id', getWaitlistById);
router.post('/', createWaitlistEntry);
router.put('/:id', updateWaitlistEntry);
router.delete('/:id', deleteWaitlistEntry);

export default router;