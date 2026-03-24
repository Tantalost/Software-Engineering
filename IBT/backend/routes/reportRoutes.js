import express from 'express';
import { 
    createReport, 
    getAllReports, 
    getReportById, 
    deleteReport,
    archiveReport,
    restoreReport,
    getArchivedReports
} from '../controllers/reportController.js';

const router = express.Router();

// Standard Routes
router.post('/', createReport);
router.get('/', getAllReports);
router.get('/:id', getReportById);

// Soft Delete Routes
router.get('/archived', getArchivedReports);
router.patch('/:id/archive', archiveReport);
router.patch('/:id/restore', restoreReport);

// Hard Delete Route
router.delete('/:id', deleteReport);

export default router;