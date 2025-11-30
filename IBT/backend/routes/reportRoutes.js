import express from 'express';
import { 
    createReport, 
    getAllReports, 
    getReportById, 
    deleteReport 
} from '../controllers/reportController.js'; // Ensure .js extension is here

const router = express.Router();

router.post('/', createReport);
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);

export default router;