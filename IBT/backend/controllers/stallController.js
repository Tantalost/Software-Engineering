import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Settings from '../models/Settings.js';
import Notification from '../models/Notification.js'; 
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import path from 'path';

const SECRET_KEY = process.env.ENCRYPTION_KEY || " "; 

const detectMimeTypeFromBuffer = (buffer) => {
    if (!buffer || buffer.length < 4) return null;

    if (buffer.slice(0, 4).toString() === '%PDF') return 'application/pdf';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
    ) return 'image/png';
    if (buffer.slice(0, 3).toString() === 'GIF') return 'image/gif';
    if (
        buffer.slice(0, 4).toString() === 'RIFF' &&
        buffer.slice(8, 12).toString() === 'WEBP'
    ) return 'image/webp';

    return null;
};

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
        const fileMeta = files[0] || {};

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
                                        const encryptedPayload = fileBufferRaw.toString('utf8');
                                        const candidateKeys = [
                                            SECRET_KEY,
                                            process.env.LEGACY_ENCRYPTION_KEY,
                                            " "
                                        ].filter((value, index, arr) => value && arr.indexOf(value) === index);

                                        let originalBase64 = "";

                                        for (const key of candidateKeys) {
                                            try {
                                                const bytes = CryptoJS.AES.decrypt(encryptedPayload, key);
                                                const attempt = bytes.toString(CryptoJS.enc.Utf8);
                                                if (attempt) {
                                                    originalBase64 = attempt;
                                                    break;
                                                }
                                            } catch (_) {
                                                continue;
                                            }
                                        }

                                        if (!originalBase64) {
                                            return res.status(422).send("Unable to decrypt file");
                                        }

                                        finalBuffer = Buffer.from(originalBase64, 'base64');
                                } catch (e) { return res.status(500).send("Decryption Failed"); }
            } else {
                finalBuffer = fileBufferRaw;
            }

                        const ext = path.extname(filename).toLowerCase();
                        let contentType = detectMimeTypeFromBuffer(finalBuffer) || fileMeta.contentType || 'application/octet-stream';
                        if (contentType === 'application/octet-stream') {
                            if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
                            if (['.png'].includes(ext)) contentType = 'image/png';
                            if (['.pdf'].includes(ext)) contentType = 'application/pdf';
                            if (['.webp'].includes(ext)) contentType = 'image/webp';
                            if (['.gif'].includes(ext)) contentType = 'image/gif';
                        }

            res.setHeader('Content-Type', contentType);
                        res.setHeader('Content-Disposition', 'inline');
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
        
        const tenants = await Tenant.find({ 
            tenantType: floor, 
            isArchived: { $ne: true } 
        });
        
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
            isArchived: { $ne: true },
            $or: [
                { uid: userId },
                { slotNo: { $in: approvedSlots } }
            ]
        }).lean();

        let combinedApps = applications.filter(app => {
            if (app.status === 'TENANT') {
                return tenants.some(t => t.slotNo && t.slotNo.includes(app.targetSlot));
            }
            return true;
        });
        
        const nightSetting = await Settings.findOne({ key: "defaultNightPrice" });
        const permSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
        const globalNightPrice = nightSetting ? Number(nightSetting.value) : 150;
        const globalPermPrice = permSetting ? Number(permSetting.value) : 6000;
                
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
                tenantDbStatus: tenant.status, 
                start: tenant.StartDateTime,
                due: calcDue,
                rentAmount: calcRent,
                utilityAmount: calcUtil,
                totalAmount: calcTotal,
                feeBreakdown: tenant.feeBreakdown,
                tenantId: tenant._id,

                paymentHistory: tenant.paymentHistory || [], 
                paymentReference: tenant.referenceNo, 
                paymentAmount: tenant.totalAmount || tenant.rentAmount,
                receiptUrl: tenant.documents?.proofOfReceipt || "",
   
                permitUrl: tenant.documents?.businessPermit || "",
                validIdUrl: tenant.documents?.validID || "",
                contractUrl: tenant.documents?.contract || "",
                communityTaxUrl: tenant.documents?.communityTax || "", 
                policeClearanceUrl: tenant.documents?.policeClearance || "" 
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
          slotNo: { $regex: new RegExp(`\\b${data.targetSlot}\\b`, 'i') },
          isArchived: { $ne: true } 
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

        if (!paymentReference || paymentReference.trim() === "") {
            return res.status(400).json({ message: "A valid Reference / OR Number is required." });
        }

        const duplicateApp = await TenantApplication.findOne({
            paymentReference: paymentReference,
            $or: [{ userId: { $ne: userId } }, { targetSlot: { $ne: targetSlot } }] 
        });

        if (duplicateApp) {
            return res.status(400).json({ message: "This Reference / OR Number is already used in another application." });
        }

        const duplicateTenant = await Tenant.findOne({
            $or: [
                { referenceNo: paymentReference },
                { "paymentHistory.referenceNo": paymentReference }
            ]
        });

        if (duplicateTenant) {
            return res.status(400).json({ message: "This Reference / OR Number has already been used for a lease payment." });
        }

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
        
        if (!paymentReference || paymentReference.trim() === "") {
            return res.status(400).json({ message: "A valid Reference / OR Number is required." });
        }

        const duplicateApp = await TenantApplication.findOne({
            paymentReference: paymentReference
        });

        if (duplicateApp) {
            return res.status(400).json({ message: "This Reference / OR Number is already used in a pending application." });
        }

        const duplicateTenant = await Tenant.findOne({
            $or: [
                { referenceNo: paymentReference, _id: { $ne: tenantId } },
                { "paymentHistory.referenceNo": paymentReference }
            ]
        });

        if (duplicateTenant) {
            return res.status(400).json({ message: "This Reference / OR Number has already been used in a previous transaction." });
        }

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