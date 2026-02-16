import express from 'express';
import { getLostItems } from '../controllers/lostnFoundController.js';

const router = express.Router();

router.get('/', getLostItems);

export default router;