import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY 
  ? Buffer.from(process.env.FILE_ENCRYPTION_KEY, 'hex') 
  : crypto.randomBytes(32); 

const IV_LENGTH = 16; 

const encryptFile = async (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(fileContent);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const output = Buffer.concat([iv, encrypted]);
        
        const encryptedPath = filePath + '.enc';
        fs.writeFileSync(encryptedPath, output);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return encryptedPath;
    } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error("File encryption failed");
    }
};

export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTenant = async (req, res) => {
  try {
   
    const processUpload = async (fieldName) => {
        if (req.files && req.files[fieldName]) {
            const originalPath = req.files[fieldName][0].path;
            const securePath = await encryptFile(originalPath);
            return path.basename(securePath);
        }
        return null;
    };

    const businessPermitPath = await processUpload('businessPermit');
    const validIDPath = await processUpload('validID');
    const contractPath = await processUpload('contract');

    const tenantData = {
        ...req.body,
        
        documents: {
            businessPermit: businessPermitPath,
            validID: validIDPath,
            contract: contractPath
        }
    };

    const newTenant = new Tenant(tenantData);
    const savedTenant = await newTenant.save();

    if (req.body.transferWaitlistId) {
        await TenantApplication.findByIdAndUpdate(
            req.body.transferWaitlistId,
            { status: 'TENANT' } 
        );
    }

    const subject = "Final Approval - Welcome to IBT Stalls!";
    const message = `
Congratulations ${savedTenant.tenantName}!

You have been officially approved as a tenant at Zamboanga City IBT.

DETAILS:
--------------------------------
Stall Number: ${savedTenant.slotNo}
Tenant Type:  ${savedTenant.tenantType}
Rent Amount:  ₱${savedTenant.rentAmount}

RULES AND REGULATIONS:
1. Operating hours are from 8:00 AM to 10:00 PM.
2. Keep your area clean at all times.
3. No sub-leasing of stalls is allowed.
4. Monthly rent is due on the ${new Date(savedTenant.StartDateTime).getDate()}th of every month.

You may now start operating your business.

Welcome aboard!
IBT Management
    `;

    if (savedTenant.email) {
        try {
            await sendEmail({
                email: savedTenant.email,
                subject: subject,
                message: message
            });
        } catch (emailError) {
            console.error("Welcome email failed:", emailError.message);
        }
    }

    res.status(201).json(savedTenant);

  } catch (error) {
    console.error("Create Tenant Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
   
    const updateData = { ...req.body };

    const processUpload = async (fieldName) => {
        if (req.files && req.files[fieldName]) {
            const originalPath = req.files[fieldName][0].path;
            const securePath = await encryptFile(originalPath);
            return path.basename(securePath);
        }
        return null;
    };

    const newPermit = await processUpload('businessPermit');
    const newID = await processUpload('validID');
    const newContract = await processUpload('contract');

    if (newPermit) updateData['documents.businessPermit'] = newPermit;
    if (newID) updateData['documents.validID'] = newID;
    if (newContract) updateData['documents.contract'] = newContract;

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedTenant) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Update Tenant Error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const deleteTenant = async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Tenant deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};