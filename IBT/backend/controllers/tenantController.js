import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";
import Settings from "../models/Settings.js";

export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const archiveTenant = async (req, res) => {
  try {
    const archived = await Tenant.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!archived) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json({ message: "Tenant archived successfully", tenant: archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreTenant = async (req, res) => {
  try {
    const restored = await Tenant.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    if (!restored) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json({ message: "Tenant restored successfully", tenant: restored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchivedTenants = async (req, res) => {
  try {
    const archived = await Tenant.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.status(200).json(archived);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- HARD DELETE ---
export const deleteTenant = async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Tenant permanently deleted" });
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
    const barangayClearance = getFile('barangayClearance'); 
    const proofOfReceipt = getFile('proofOfReceipt');

    const tenantData = {
        ...req.body,
        documents: {
           
            ...(req.body.documents || {}),
            businessPermit: businessPermit || req.body.documents?.businessPermit,
            validID: validID || req.body.documents?.validID,
            contract: contract || req.body.documents?.contract,
            barangayClearance: barangayClearance || req.body.documents?.barangayClearance, 
            proofOfReceipt: proofOfReceipt || req.body.documents?.proofOfReceipt          
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
    const newClearance = getFile('barangayClearance'); 
    const newReceipt = getFile('proofOfReceipt');     

    if (newPermit) updateData['documents.businessPermit'] = newPermit;
    if (newID) updateData['documents.validID'] = newID;
    if (newContract) updateData['documents.contract'] = newContract;
    if (newClearance) updateData['documents.barangayClearance'] = newClearance; 
    if (newReceipt) updateData['documents.proofOfReceipt'] = newReceipt;

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

// --- DYNAMIC PRICING FOR NIGHT MARKET ---

// Get default night market price from settings
export const getDefaultNightPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultNightPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 150; // Fallback to 150
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update default price and apply to unpaid/due Night Market tenants
export const updateAllNightMarketPrices = async (req, res) => {
  try {
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    const priceValue = parseFloat(newPrice);

    // Update or create the default price setting in database
    await Settings.findOneAndUpdate(
      { key: "defaultNightPrice" },
      { key: "defaultNightPrice", value: priceValue },
      { upsert: true, new: true }
    );

    // Optional: Update all Night Market tenants whose status is "Due" to reflect the new price.
    // (We only update "Due" so we don't accidentally overwrite historical "Paid" records)
    const result = await Tenant.updateMany(
      { tenantType: "Night Market", status: "Due" },
      { rentAmount: priceValue }
    );

    res.status(200).json({
      message: `Updated default price and ${result.modifiedCount} due night market tenants.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};