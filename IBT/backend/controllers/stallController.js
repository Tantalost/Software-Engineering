import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Settings from '../models/Settings.js';
import Notification from '../models/Notification.js'; 
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import path from 'path';

const SECRET_KEY = process.env.ENCRYPTION_KEY || " "; 

const createAdminNotification = async (title, message) => {
  try {
    const newNote = new Notification({
      title,
      message,
      source: "System",
      targetRole: "superadmin", 
      date: new Date().toISOString().split('T')[0]
    });
    await newNote.save();
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

export const getSecureDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { 
            bucketName: 'uploads' 
        });

        const cursor = bucket.find({ filename: filename });
        const files = await cursor.toArray();
        if (!files.length) return res.status(404).send("File not found");

        const downloadStream = bucket.openDownloadStreamByName(filename);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', () => res.status(500).send("Stream Error"));
        
        downloadStream.on('end', () => {
            const fileBufferRaw = Buffer.concat(chunks);
            
            const header = fileBufferRaw.toString('utf8', 0, 8);
            const isEncrypted = header === 'U2FsdGVk'; 
            
            let finalBuffer;
            if (isEncrypted) {
                try {
                    const bytes = CryptoJS.AES.decrypt(fileBufferRaw.toString('utf8'), SECRET_KEY);
                    const originalBase64 = bytes.toString(CryptoJS.enc.Utf8);
                    finalBuffer = Buffer.from(originalBase64, 'base64');
                } catch (e) { return res.status(500).send("Decryption Failed"); }
            } else {
                finalBuffer = fileBufferRaw;
            }

            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
            if (['.png'].includes(ext)) contentType = 'image/png';
            if (['.pdf'].includes(ext)) contentType = 'application/pdf';

            res.setHeader('Content-Type', contentType);
            res.send(finalBuffer);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


export const getOccupiedStalls = async (req, res) => {
   
    try {
        const { floor } = req.query; 
        const tenants = await Tenant.find({ tenantType: floor });
        let occupiedLabels = [];
        tenants.forEach(t => {
          if (t.slotNo) {
            const slots = t.slotNo.split(',').map(s => s.trim());
            occupiedLabels.push(...slots);
          }
        });
        res.json(occupiedLabels);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const getPendingStalls = async (req, res) => {
  try {
    const { floor } = req.query; 
    const activeStatuses = ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'];
    const pendingApps = await TenantApplication.find({ floor: floor, status: { $in: activeStatuses } }).select('targetSlot'); 
    
    
    let pendingLabels = [];
    pendingApps.forEach(app => {
        if (app.targetSlot) {
            const slots = app.targetSlot.split(',').map(s => s.trim());
            pendingLabels.push(...slots);
        }
    });
    res.json(pendingLabels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplication = async (req, res) => {
    try {
        const { userId } = req.params;
        
        let applications = await TenantApplication.find({ userId }).lean();
        
        const approvedSlots = applications
            .filter(app => app.status === 'TENANT')
            .map(app => app.targetSlot);

        const tenants = await Tenant.find({ 
            $or: [
                { uid: userId },
                { slotNo: { $in: approvedSlots } }
            ]
        }).lean();
        
        const nightSetting = await Settings.findOne({ key: "defaultNightPrice" });
        const permSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
        const globalNightPrice = nightSetting ? Number(nightSetting.value) : 150;
        const globalPermPrice = permSetting ? Number(permSetting.value) : 6000;
        
        let combinedApps = [...applications];
        
        tenants.forEach(tenant => {
            const existingAppIndex = combinedApps.findIndex(app => tenant.slotNo && tenant.slotNo.includes(app.targetSlot));
            const slotCount = tenant.slotNo ? tenant.slotNo.split(',').length : 1;
            const isNightMarket = tenant.tenantType === 'Night Market';
            
           
            let calcRent = tenant.rentAmount;
            if (!calcRent || calcRent === 0) {
                 calcRent = isNightMarket ? (globalNightPrice * slotCount) : (globalPermPrice * slotCount);
            }
            
            const calcUtil = tenant.utilityAmount || 0;
            const calcTotal = (tenant.totalAmount && tenant.totalAmount > 0) ? tenant.totalAmount : (calcRent + calcUtil);

            let calcDue = tenant.DueDateTime;
            if (!calcDue && tenant.StartDateTime) {
                 const d = new Date(tenant.StartDateTime);
                 if (isNightMarket) d.setDate(d.getDate() + 7);
                 else d.setMonth(d.getMonth() + 1);
                 calcDue = d.toISOString();
            }
            
            const tenantData = {
                status: 'TENANT',
                start: tenant.StartDateTime,
                due: calcDue,
                rentAmount: calcRent,
                utilityAmount: calcUtil,
                totalAmount: calcTotal,
                tenantId: tenant._id,

                paymentHistory: tenant.paymentHistory || [], 
                paymentReference: tenant.referenceNo, 
                paymentAmount: tenant.totalAmount || tenant.rentAmount,
                receiptUrl: tenant.documents?.proofOfReceipt || ""
            };

            if (existingAppIndex >= 0) {
                combinedApps[existingAppIndex] = { ...combinedApps[existingAppIndex], ...tenantData };
            } else {
                combinedApps.push({ ...tenantData, targetSlot: tenant.slotNo, floor: tenant.tenantType });
            }
        });
        
        res.json(combinedApps); 
      } catch (error) { res.status(500).json({ message: error.message }); }
};

export const submitApplication = async (req, res) => {
  
    try {
        const data = req.body; 
        const files = req.files;

        if (files) {
            if (files.permit?.[0]) data.permitUrl = files.permit[0].filename;
            if (files.validId?.[0]) data.validIdUrl = files.validId[0].filename;
            if (files.clearance?.[0]) data.clearanceUrl = files.clearance[0].filename;
            if (files.communityTax?.[0]) data.communityTaxUrl = files.communityTax[0].filename;
            if (files.policeClearance?.[0]) data.policeClearanceUrl = files.policeClearance[0].filename;
        }

        const existingTenant = await Tenant.findOne({ 
          slotNo: { $regex: new RegExp(`\\b${data.targetSlot}\\b`, 'i') } 
        });

        if (existingTenant) return res.status(400).json({ message: "Sorry, this slot was just taken by another user." });
        
        const pendingApp = await TenantApplication.findOne({ 
            targetSlot: data.targetSlot, 
            status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'] } 
        });
        if (pendingApp) return res.status(400).json({ message: "Someone else is currently applying for this slot." });
        
        
        const newApp = await TenantApplication.findOneAndUpdate(
            { userId: data.userId, targetSlot: data.targetSlot }, 
            { ...data, status: 'VERIFICATION_PENDING', adminViewed: false },
            { new: true, upsert: true }
        );

        await createAdminNotification("New Application Received", `Applicant ${data.name} has applied for slot ${data.targetSlot}.`);
        res.json(newApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const submitPayment = async (req, res) => {
    try {
        
        const { userId, targetSlot, paymentReference, paymentAmount } = req.body;
        
        let receiptUrl = "";
        if (req.file) { receiptUrl = req.file.filename; } else if (req.body.receiptUrl) { receiptUrl = req.body.receiptUrl; }
        if (!receiptUrl) return res.status(400).json({ message: "Receipt file is missing." });
        
       
        const updatedApp = await TenantApplication.findOneAndUpdate(
            { userId: userId, targetSlot: targetSlot }, 
            { receiptUrl, paymentReference, paymentAmount, status: 'PAYMENT_REVIEW', paymentSubmittedAt: new Date(), adminViewed: false },
            { new: true }
        );
        
        await createAdminNotification("Payment Receipt Uploaded", `Ref: ${paymentReference}. Verify payment for Applicant ID: ${userId.slice(-6)}.`);
        res.json(updatedApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const uploadContract = async (req, res) => {
    try {
       
        const { userId, targetSlot } = req.body;
        
        let contractUrl = "";
        if (req.file) contractUrl = req.file.filename;
        if (!userId || !targetSlot || !contractUrl) return res.status(400).json({ message: "Missing userId, targetSlot, or contract file" });
        
        
        const updatedApp = await TenantApplication.findOneAndUpdate(
            { userId: userId, targetSlot: targetSlot }, 
            { contractUrl, status: 'CONTRACT_REVIEW', contractSubmittedAt: new Date(), adminViewed: false },
            { new: true }
        );
        
        await createAdminNotification("Contract Signed", "A new signed contract has been uploaded.");
        if (!updatedApp) return res.status(404).json({ message: "Application not found" });
        res.json(updatedApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const submitRenewalPayment = async (req, res) => {
    try {
        const { tenantId, paymentReference } = req.body;
        
        let receiptUrl = "";
        if (req.file) { receiptUrl = req.file.filename; } 
        else if (req.body.receiptUrl) { receiptUrl = req.body.receiptUrl; }
        
        if (!receiptUrl) return res.status(400).json({ message: "Receipt file is missing." });
        if (!tenantId) return res.status(400).json({ message: "Tenant ID is missing." });

        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            { 
                status: "Payment Review", 
                referenceNo: paymentReference,
                "documents.proofOfReceipt": receiptUrl
            },
            { new: true }
        );

        await createAdminNotification("Renewal Payment Uploaded", `Ref: ${paymentReference}. Verify renewal payment for Slot ${updatedTenant.slotNo}.`);
        res.json(updatedTenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};