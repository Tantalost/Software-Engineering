import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js"; 
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SECRET_KEY = process.env.ENCRYPTION_KEY || " "; 
console.log(`[Server] Loaded Key Length: ${SECRET_KEY.length} characters`); 

export const getSecureDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        const safeFilename = path.basename(filename).trim();
        
        const uploadDir = path.join(os.homedir(), 'stalls_app_uploads'); 
        const filePath = path.join(uploadDir, safeFilename);
       
        if (!fs.existsSync(filePath)) {
            console.error(`[Viewer] 404: File not found at ${filePath}`);
            return res.status(404).send("Document not found.");
        }

        const fileBufferRaw = fs.readFileSync(filePath);

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
                console.error("[Viewer] Decrypt Fail:", err.message);
                return res.status(500).send("Decryption Failed.");
            }
        } else {
            finalBuffer = fileBufferRaw;
        }

        const ext = path.extname(safeFilename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        if (['.png'].includes(ext)) contentType = 'image/png';
        if (['.pdf'].includes(ext)) contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.send(finalBuffer);

    } catch (error) {
        console.error("[Viewer] Error:", error);
        res.status(500).send("Server Error");
    }
};

export const getWaitlist = async (req, res) => {
  try {
    const list = await TenantApplication.find()
      .select('-permitUrl -validIdUrl -clearanceUrl -receiptUrl -contractUrl') 
      .sort({ createdAt: -1 });
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
    const { status } = req.body;
    const applicant = await TenantApplication.findByIdAndUpdate(id, req.body, { new: true });

    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    let message = "";
    let subject = "";

    if (status === "PAYMENT_UNLOCKED") {
        subject = "Application Approved - Payment Unlocked";
        message = `Dear ${applicant.name},\n\nYour application has been approved!\n\nPlease open the app to view the "Stall Order of Payment".\nYou are required to upload your payment receipt photo for final verification.\n\nThank you!`;
    } 
    else if (status === "CONTRACT_PENDING") {
        subject = "Action Required: Upload Contract";
        message = `Dear ${applicant.name},\n\nWe have verified your payment.\nSince you applied for a Permanent slot, please upload your Signed Contract document via the app to proceed.\n\nThank you!`;
    }

    if (subject && applicant.email) {
        try {
            await sendEmail({ email: applicant.email, subject: subject, message: message });
        } catch (emailError) { console.error("Email failed:", emailError.message); }
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