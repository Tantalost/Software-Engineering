import express from "express";
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import "dotenv/config"; 
import { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  updateTenant,
  archiveTenant,    
  restoreTenant,     
  getArchivedTenants,
  getDefaultNightPrice,          
  updateAllNightMarketPrices,
  sendTenantEmail,
  getDefaultPermanentPrice,
  updateAllPermanentPrices,
  approveRenewalPayment,
  getOverdueSettings,      
  updateOverdueSettings,
  startOperation,
  toggleOperationStatus,
  processMoveOut,
  rejectRenewalPayment,
  submitTenantsForShift,
  getTenantContracts,
  addTenantContract,
  updateTenantContract,
  activateTenantContract,
  deleteTenantContract,
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  getDefaultContractConfig,
  updateDefaultContractConfig,
  approveRenewalContractRequest,
  rejectRenewalContractRequest,
} from "../controllers/tenantController.js";

const router = express.Router();


const storage = new GridFsStorage({

  url: process.env.MONGODB_URL, 
  file: (req, file) => {
    return {
      bucketName: 'uploads', 
      
      filename: `${Date.now()}-${file.originalname}` 
    };
  }
});

storage.on('connection', () => {
  console.log("Multer-GridFS (Tenants): Connected successfully.");
});

storage.on('connectionError', (err) => {
  console.error("Multer-GridFS (Tenants): Connection Failed!", err);
});

const upload = multer({ storage });

router.get('/', getTenants);
router.get('/archived', getArchivedTenants);
router.get('/night-market/default-price', getDefaultNightPrice);
router.put('/update-night-market-prices', updateAllNightMarketPrices);
router.get('/permanent/default-price', getDefaultPermanentPrice);
router.put('/update-permanent-prices', updateAllPermanentPrices);
router.put('/:id/approve-renewal', approveRenewalPayment);
router.post('/send-email', sendTenantEmail);
router.get('/overdue-settings', getOverdueSettings);
router.put('/update-overdue-settings', updateOverdueSettings);
router.post('/move-out', processMoveOut);
router.put('/:id/reject-renewal', rejectRenewalPayment);
router.put('/submit-shift', submitTenantsForShift);

router.get('/contracts/default-config', getDefaultContractConfig);
router.put('/contracts/default-config', updateDefaultContractConfig);
router.get('/contracts/templates', getContractTemplates);
router.post('/contracts/templates', upload.single('contract'), createContractTemplate);
router.put('/contracts/templates/:templateId', upload.single('contract'), updateContractTemplate);
router.delete('/contracts/templates/:templateId', deleteContractTemplate);

router.get('/:id/contracts', getTenantContracts);
router.post('/:id/contracts', upload.single('contract'), addTenantContract);
router.put('/:id/contracts/:contractId', upload.single('contract'), updateTenantContract);
router.put('/:id/contracts/:contractId/approve-renewal-request', approveRenewalContractRequest);
router.put('/:id/contracts/:contractId/reject-renewal-request', rejectRenewalContractRequest);
router.patch('/:id/contracts/:contractId/activate', activateTenantContract);
router.delete('/:id/contracts/:contractId', deleteTenantContract);

router.post('/', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 },
    { name: 'barangayClearance', maxCount: 1 },
    { name: 'proofOfReceipt', maxCount: 1 },
    { name: 'communityTax', maxCount: 1 },    
    { name: 'policeClearance', maxCount: 1 }    
  ]), 
  createTenant
);

router.patch('/:id/start-operation', startOperation);
router.patch('/:id/toggle-operation', toggleOperationStatus);
router.patch('/:id/archive', archiveTenant);
router.patch('/:id/restore', restoreTenant);

router.delete('/:id', deleteTenant);

router.put('/:id', 
  upload.fields([
    { name: 'businessPermit', maxCount: 1 }, 
    { name: 'validID', maxCount: 1 },
    { name: 'contract', maxCount: 1 },
    { name: 'barangayClearance', maxCount: 1 }, 
    { name: 'proofOfReceipt', maxCount: 1 }, 
    { name: 'communityTax', maxCount: 1 },    
    { name: 'policeClearance', maxCount: 1 }   
  ]), 
  updateTenant
);

export default router;