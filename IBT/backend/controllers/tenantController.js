import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";
import Settings from "../models/Settings.js";

const normalizeFeeBreakdown = (rawBreakdown = {}, tenantType = "Permanent") => {
  const isNightMarket = tenantType === "Night Market";
  const electricity = isNightMarket ? 0 : Number(rawBreakdown.electricity || 0);
  const otherAmount = Number(rawBreakdown.otherAmount || 0);

  return {
    garbageFee: 0,
    permitFee: 0,
    businessTaxes: 0,
    water: 0,
    electricity,
    otherAmount,
    otherSpecify: rawBreakdown.otherSpecify || ""
  };
};

export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const sendTenantEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Email, subject, and message are required." });
    }

  
    await sendEmail({
      email: email,
      subject: subject,
      message: message
    });

    res.status(200).json({ success: true, message: "Email sent successfully to tenant." });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email. Please try again." });
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
    const communityTax = getFile('communityTax');       
    const policeClearance = getFile('policeClearance');

    const submittedRef = req.body.referenceNo;
    if (!submittedRef || submittedRef.trim() === "") {
        return res.status(400).json({ error: "A valid Reference / OR Number is required." });
    }

    const existingReceipt = await Tenant.findOne({
        $or: [
            { referenceNo: submittedRef },
            { "paymentHistory.referenceNo": submittedRef }
        ]
    });

    if (existingReceipt) {
        return res.status(400).json({ error: "This Reference / OR Number has already been used." });
    }

    let parsedFeeBreakdown = {};
    if (req.body.feeBreakdown) {
        try {
            parsedFeeBreakdown = typeof req.body.feeBreakdown === 'string' 
                ? JSON.parse(req.body.feeBreakdown) 
                : req.body.feeBreakdown;
        } catch (e) {
            console.error("Error parsing feeBreakdown:", e);
        }
    }

    const normalizedFeeBreakdown = normalizeFeeBreakdown(parsedFeeBreakdown, req.body.tenantType);
    req.body.utilityAmount = Number(normalizedFeeBreakdown.electricity || 0) + Number(normalizedFeeBreakdown.otherAmount || 0);

    const tenantData = {
        ...req.body,
      feeBreakdown: normalizedFeeBreakdown,
        paymentHistory: [{
            referenceNo: req.body.referenceNo || "Initial Payment",
            amount: req.body.totalAmount || req.body.rentAmount || 0,
            datePaid: new Date().toISOString(),
            receiptUrl: proofOfReceipt || req.body.documents?.proofOfReceipt || ""
        }],
        documents: {
            ...(req.body.documents || {}),
            businessPermit: businessPermit || req.body.documents?.businessPermit,
            validID: validID || req.body.documents?.validID,
            contract: contract || req.body.documents?.contract,
            barangayClearance: barangayClearance || req.body.documents?.barangayClearance, 
            proofOfReceipt: proofOfReceipt || req.body.documents?.proofOfReceipt,
            communityTax: communityTax || req.body.documents?.communityTax,             
            policeClearance: policeClearance || req.body.documents?.policeClearance 
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
  
    const oldTenant = await Tenant.findById(req.params.id);

    const updateData = { ...req.body };

    if (updateData.feeBreakdown) {
        try {
            updateData.feeBreakdown = typeof updateData.feeBreakdown === 'string' 
                ? JSON.parse(updateData.feeBreakdown) 
                : updateData.feeBreakdown;
        } catch (e) {
            console.error("Error parsing feeBreakdown:", e);
        }
    }

    if (updateData.paymentHistory) {
        if (typeof updateData.paymentHistory === 'string') {
            if (updateData.paymentHistory.includes('[object Object]')) {
               
                delete updateData.paymentHistory;
            } else {
               
                try {
                    updateData.paymentHistory = JSON.parse(updateData.paymentHistory);
                } catch (e) {
                    console.error("Error parsing paymentHistory:", e);
                    delete updateData.paymentHistory; 
                }
            }
        }
    }

    const effectiveTenantType = updateData.tenantType || oldTenant.tenantType;
    const normalizedFeeBreakdown = normalizeFeeBreakdown(updateData.feeBreakdown || oldTenant.feeBreakdown || {}, effectiveTenantType);
    updateData.feeBreakdown = normalizedFeeBreakdown;
    updateData.utilityAmount = Number(normalizedFeeBreakdown.electricity || 0) + Number(normalizedFeeBreakdown.otherAmount || 0);

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
    const newCommunityTax = getFile('communityTax');      
    const newPoliceClearance = getFile('policeClearance');     

    if (newPermit) updateData['documents.businessPermit'] = newPermit;
    if (newID) updateData['documents.validID'] = newID;
    if (newContract) updateData['documents.contract'] = newContract;
    if (newClearance) updateData['documents.barangayClearance'] = newClearance; 
    if (newReceipt) updateData['documents.proofOfReceipt'] = newReceipt;
    if (newCommunityTax) updateData['documents.communityTax'] = newCommunityTax;             
    if (newPoliceClearance) updateData['documents.policeClearance'] = newPoliceClearance;


    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedTenant) return res.status(404).json({ error: "Tenant not found" });

    
    if (oldTenant && oldTenant.status !== 'Overdue' && updatedTenant.status === 'Overdue' && updatedTenant.email) {
      try {
        // Calculate overdue information
        const rent = updatedTenant.rentAmount || 0;
        const totalAmount = updatedTenant.totalAmount || rent;
        const dueDate = updatedTenant.DueDateTime ? new Date(updatedTenant.DueDateTime) : new Date();
        const computationDate = new Date();
        
        // Get last payment info
        const lastPayment = updatedTenant.paymentHistory && updatedTenant.paymentHistory.length > 0 
          ? updatedTenant.paymentHistory.sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid))[0]
          : null;
        
        const lastPaymentMonth = lastPayment ? new Date(lastPayment.datePaid).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';
        const lastPaymentAmount = lastPayment ? lastPayment.amount : 0;
        
        // Calculate period (simplified - from due date to current month)
        const dueMonth = dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const currentMonth = computationDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const periodText = dueMonth === currentMonth ? dueMonth : `${dueMonth} to ${currentMonth}`;
        
        const subject = "Final Notice: Overdue Rent Payment";
        const message = `Sir/Ma'am ${updatedTenant.tenantName || updatedTenant.name},

This serves as our final notice for your settle your unpaid rent for the space you occupy at Integrated Bus Terminal which now amounts to ₱${totalAmount.toLocaleString()}, inclusive of surcharge and interests, covering the period of ${periodText}, computed as of ${computationDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. The last payment you made was on ${lastPaymentMonth} amounting to ₱${lastPaymentAmount.toLocaleString()}. No payment has been made thereafter, thus this bill.

Kindly settle your account within five (5) days from receipt hereof. Otherwise, we will forward this matter to the Office of the City Legal for appropriate legal action to the effect collection of the same.

Thank you`;

        await sendEmail({ email: updatedTenant.email, subject, message });
      } catch (emailErr) {
        console.error("Overdue email failed:", emailErr.message);
      }
    }

    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Update Tenant Error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getDefaultNightPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultNightPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 150; 
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateAllNightMarketPrices = async (req, res) => {
  try {
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    const priceValue = parseFloat(newPrice);
    const priceString = priceValue.toString(); 

   
    await Settings.findOneAndUpdate(
      { key: "defaultNightPrice" },
      { key: "defaultNightPrice", value: priceValue },
      { upsert: true, new: true }
    );

    const tenantResult = await Tenant.updateMany(
      { tenantType: "Night Market", status: "Due" },
      { rentAmount: priceValue }
    );

    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Night Market" }, { preferredType: "Night Market" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: priceString }
    );

    res.status(200).json({
      message: `Updated global night market price.`,
      modifiedCount: tenantResult.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getDefaultPermanentPrice = async (req, res) => {
  try {
    const priceSetting = await Settings.findOne({ key: "defaultPermanentPrice" });
    const defaultPrice = priceSetting ? Number(priceSetting.value) : 6000;
    res.status(200).json({ defaultPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAllPermanentPrices = async (req, res) => {
  try {
    const { newPrice } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    const priceValue = parseFloat(newPrice);
    const priceString = priceValue.toString(); 

    
    await Settings.findOneAndUpdate(
      { key: "defaultPermanentPrice" },
      { key: "defaultPermanentPrice", value: priceValue },
      { upsert: true, new: true }
    );

   
    const tenantResult = await Tenant.updateMany(
      { 
        $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }], 
        status: "Due" 
      },
      { rentAmount: priceValue }
    );

   
    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Permanent" }, { preferredType: "Permanent" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: priceString }
    );

    res.status(200).json({
      message: `Updated global permanent price. Modified ${tenantResult.modifiedCount} active tenants and ${applicationResult.modifiedCount} pending applications.`,
      tenantModifiedCount: tenantResult.modifiedCount,
      applicationModifiedCount: applicationResult.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveRenewalPayment = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const submittedRef = tenant.referenceNo;
    if (!submittedRef || submittedRef === "N/A" || submittedRef.trim() === "") {
        return res.status(400).json({ error: "Cannot approve: No Reference/OR Number was provided." });
    }

    const existingHistoryReceipt = await Tenant.findOne({
        "paymentHistory.referenceNo": submittedRef
    });

    if (existingHistoryReceipt) {
        return res.status(400).json({ error: "This Reference / OR Number was already used in a previous month." });
    }

    const isNightMarket = tenant.tenantType === 'Night Market';
    
    const baseDate = tenant.DueDateTime ? new Date(tenant.DueDateTime) : 
                     (tenant.StartDateTime ? new Date(tenant.StartDateTime) : new Date());
                     
    const currentDue = new Date(baseDate);

    if (isNightMarket) {
        currentDue.setDate(currentDue.getDate() + 7);
    } else {
        currentDue.setMonth(currentDue.getMonth() + 1);
    }

    const paymentRecord = {
        referenceNo: tenant.referenceNo || "N/A",
        amount: tenant.totalAmount || tenant.rentAmount || 0,
        datePaid: new Date().toISOString(),
        receiptUrl: tenant.documents?.proofOfReceipt || "" 
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { 
          status: "Paid", 
          DueDateTime: currentDue.toISOString(),
          $push: { paymentHistory: paymentRecord },
         
          $unset: { 
              referenceNo: "",
              "documents.proofOfReceipt": "" 
          }
      },
      { new: true }
    );

    if (updatedTenant.email) {
      const subject = "Payment Approved - IBT Stalls Renewal";
      const message = `


      Dear ${updatedTenant.tenantName},

Your renewal payment of ₱${paymentRecord.amount} has been successfully verified and approved.

DETAILS:
--------------------------------
Stall Number: ${updatedTenant.slotNo}
Reference No: ${paymentRecord.referenceNo}
Next Due Date: ${new Date(updatedTenant.DueDateTime).toLocaleDateString()}

Thank you for your continued tenancy!

Best regards,
IBT Management
      `;

      try {
          await sendEmail({
              email: updatedTenant.email,
              subject: subject,
              message: message
          });
      } catch (emailError) {
          console.error("Renewal approval email failed to send:", emailError.message);
      }
    }

    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Approve Renewal Error:", error);
    res.status(500).json({ error: error.message });
  }
};