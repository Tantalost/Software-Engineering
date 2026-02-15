import express from 'express';
import { 
  getOccupiedStalls, 
  getMyApplication, 
  submitApplication, 
  submitPayment,
  uploadContract 
} from '../controllers/stallController.js';

const router = express.Router();

// Public route to see which slots are red
router.get('/occupied', getOccupiedStalls);

// UPDATED: Now uses :userId instead of :deviceId
router.get('/my-application/:userId', getMyApplication);

// Transaction routes (Apply, Pay, Contract)
router.post('/apply', submitApplication);
router.post('/pay', submitPayment);
router.post('/upload-contract', uploadContract);

export default router;