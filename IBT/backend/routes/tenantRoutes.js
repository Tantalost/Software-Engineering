import express from "express";
import { 
  getTenants, 
  createTenant, 
  deleteTenant 
} from "../controllers/tenantController.js";

const router = express.Router();

router.get('/', getTenants);
router.post('/', createTenant);
router.delete('/:id', deleteTenant);

export default router;