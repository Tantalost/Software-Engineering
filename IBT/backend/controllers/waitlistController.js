import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js"; 
import CryptoJS from 'crypto-js';
import mongoose from 'mongoose'; 
import path from 'path';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || " "; 

export const getSecureDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { 
            bucketName: 'uploads' 
        });

        const cursor = bucket.find({ filename: filename });
        const files = await cursor.toArray();
        
        if (!files.length) {
            return res.status(404).send("File not found in Database.");
        }

        const downloadStream = bucket.openDownloadStreamByName(filename);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        downloadStream.on('error', (err) => {
            console.error("Stream Error:", err);
            res.status(500).send("Error reading file.");
        });

        downloadStream.on('end', () => {
            const fileBufferRaw = Buffer.concat(chunks);
            const header = fileBufferRaw.toString('utf8', 0, 8);
            const isEncrypted = header === 'U2FsdGVk'; 
            
            let finalBuffer;
            if (isEncrypted) {
                try {
                    const fileContentStr = fileBufferRaw.toString('utf8');
                    const bytes = CryptoJS.AES.decrypt(fileContentStr, SECRET_KEY);
                    const originalBase64 = bytes.toString(CryptoJS.enc.Utf8);
                    if (!originalBase64) throw new Error("Empty decryption");
                    finalBuffer = Buffer.from(originalBase64, 'base64');
                } catch (err) {
                    return res.status(500).send("Decryption Failed.");
                }
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
        console.error("Viewer Error:", error);
        res.status(500).send("Server Error");
    }
};

export const getWaitlist = async (req, res) => {
  try {
    const list = await TenantApplication.find().select('-permitUrl -validIdUrl -clearanceUrl -receiptUrl -contractUrl').sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWaitlistById = async (req, res) => {
  try {
    const entry = await TenantApplication.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Not Found" });
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createWaitlistEntry = async (req, res) => {
  try {
    const newEntry = new TenantApplication(req.body);
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWaitlistEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; 

    const applicant = await TenantApplication.findByIdAndUpdate(id, req.body, { new: true });
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    let message = "";
    let subject = "";

    if (status === "PAYMENT_UNLOCKED") {
        subject = "Application Approved - Payment Unlocked";
        message = `Dear ${applicant.name},\n\nYour application has been approved!\n\nPlease open the app to view the "Stall Order of Payment".`;
    } 
    else if (status === "CONTRACT_PENDING") {
        subject = "Action Required: Upload Contract";
        message = `Dear ${applicant.name},\n\nWe have verified your payment. Please upload your Signed Contract.`;
    }
   
    if (status === "REJECTED") {
        subject = "Stall Application Update: Rejected";
        message = `Dear ${applicant.name},\n\nWe regret to inform you that your application for slot ${applicant.targetSlot} has been rejected.\n\nReason: ${rejectionReason || "Did not meet required criteria or incomplete documentation."}\n\nIf you have any questions, please contact administration.`;
        console.log("Rejection block triggered! Subject set."); // <-- ADD THIS
    }

    console.log("Applicant Email exists?:", applicant.email); // <-- ADD THIS

    if (subject && applicant.email) {
        try { 
            console.log("Attempting to send email to:", applicant.email); // <-- ADD THIS
            await sendEmail({ email: applicant.email, subject: subject, message: message }); 
            console.log("Email function completed without crashing."); // <-- ADD THIS
        } 
        catch (emailError) { 
            console.error("Email failed:", emailError.message); 
        }
    } else {
        console.log("Skipped sending email. Missing subject or applicant email."); // <-- ADD THIS
    }
    
    res.status(200).json(applicant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteWaitlistEntry = async (req, res) => {
  try {
    await TenantApplication.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};