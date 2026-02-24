import express from 'express';
import upload from '../middleware/upload.js';
import { createBroadcast, getBroadcasts } from '../controllers/broadcastController.js';

const router = express.Router();

router.get('/', getBroadcasts);
router.post('/', upload.single('file'), createBroadcast);

export default router;