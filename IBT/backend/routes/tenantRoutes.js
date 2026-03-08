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
  updateAllPermanentPrices   
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
router.post('/send-email', sendTenantEmail);

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