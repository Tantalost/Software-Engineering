import express from "express";
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant
} from "../controllers/tenantController.js";

const router = express.Router();

router.get('/', getTenants);
router.post('/', createTenant);
router.delete('/:id', deleteTenant);
router.put('/:id', updateTenant);

export default router;