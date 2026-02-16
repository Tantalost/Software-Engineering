import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";


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
    
    const getFile = (fieldName) => {
        
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            return req.files[fieldName][0].filename;
        }
       
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
            return req.body[fieldName];
        }
        return null;
    };

    const businessPermit = getFile('businessPermit');
    const validID = getFile('validID');
    const contract = getFile('contract');

    const tenantData = {
        ...req.body,
        documents: {
            businessPermit: businessPermit,
            validID: validID,
            contract: contract
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

    const getFile = (fieldName) => {
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            return req.files[fieldName][0].filename;
        }
        return null; 
    };

    const newPermit = getFile('businessPermit');
    const newID = getFile('validID');
    const newContract = getFile('contract');

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