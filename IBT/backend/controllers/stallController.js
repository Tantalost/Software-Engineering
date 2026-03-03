import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
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
    const pendingLabels = pendingApps.map(app => app.targetSlot);
    res.json(pendingLabels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplication = async (req, res) => {
    try {
        const { userId } = req.params;
        
        
        let applications = await TenantApplication.find({ userId }).lean();
        
       
        const tenants = await Tenant.find({ uid: userId }).lean();
        
        let combinedApps = [...applications];
        
        
        tenants.forEach(tenant => {
           
            const existingAppIndex = combinedApps.findIndex(app => app.targetSlot === tenant.slotNo);
            
            if (existingAppIndex >= 0) {
            
                combinedApps[existingAppIndex].status = 'TENANT';
                combinedApps[existingAppIndex].start = tenant.StartDateTime;
                combinedApps[existingAppIndex].due = tenant.DueDateTime;
            } else {
                
                combinedApps.push({
                    status: 'TENANT',
                    targetSlot: tenant.slotNo,
                    floor: tenant.tenantType,
                    start: tenant.StartDateTime,
                    due: tenant.DueDateTime
                });
            }
        });
        
       
        res.json(combinedApps); 
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const submitApplication = async (req, res) => {
  
    try {
        const data = req.body; 
        const files = req.files;

        if (files) {
            if (files.permit?.[0]) data.permitUrl = files.permit[0].filename;
            if (files.validId?.[0]) data.validIdUrl = files.validId[0].filename;
            if (files.clearance?.[0]) data.clearanceUrl = files.clearance[0].filename;
        }

        const existingTenant = await Tenant.findOne({ slotNo: data.targetSlot });
        if (existingTenant) return res.status(400).json({ message: "Sorry, this slot was just taken by another user." });
        
        const pendingApp = await TenantApplication.findOne({ 
            targetSlot: data.targetSlot, 
            status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'] } 
        });
        if (pendingApp) return res.status(400).json({ message: "Someone else is currently applying for this slot." });
        
        
        const newApp = await TenantApplication.findOneAndUpdate(
            { userId: data.userId, targetSlot: data.targetSlot }, 
            { ...data, status: 'VERIFICATION_PENDING' }, 
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
            { receiptUrl, paymentReference, paymentAmount, status: 'PAYMENT_REVIEW', paymentSubmittedAt: new Date() }, 
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
            { contractUrl, status: 'CONTRACT_REVIEW', contractSubmittedAt: new Date() }, 
            { new: true }
        );
        
        await createAdminNotification("Contract Signed", "A new signed contract has been uploaded.");
        if (!updatedApp) return res.status(404).json({ message: "Application not found" });
        res.json(updatedApp);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};