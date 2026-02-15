import express from 'express';
import { getBusRoutes } from '../controllers/busRouteController.js';

const router = express.Router();

router.get('/', getBusRoutes);

export default router;