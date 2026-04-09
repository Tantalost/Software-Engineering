import Tenant from "../models/Tenant.js";
import TenantApplication from "../models/TenantApplication.js";
import sendEmail from "../utils/sendEmail.js";
import Settings from "../models/Settings.js";

import User from "../models/User.js"; 
import sendPushNotification from "../utils/sendPushNotification.js";

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
    const query = req.query.all === 'true' ? {} : { isArchived: { $ne: true }, isDeleted: { $ne: true } };
    const tenants = await Tenant.find(query).sort({ createdAt: -1 });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitTenantsForShift = async (req, res) => {
  try {
    const { sessionStartedAt, reportId } = req.body;
    if (!sessionStartedAt) {
      return res.status(400).json({ message: "sessionStartedAt is required." });
    }

    const shiftStart = new Date(sessionStartedAt);
    if (Number.isNaN(shiftStart.getTime())) {
      return res.status(400).json({ message: "Invalid sessionStartedAt." });
    }

    const now = new Date();
    const candidates = await Tenant.find({
      isArchived: { $ne: true },
      isDeleted: { $ne: true },
      $or: [
        { createdAt: { $gte: shiftStart, $lte: now } },
        { updatedAt: { $gte: shiftStart, $lte: now } },
      ],
    }).select("_id submittedAt");

    const pendingIds = candidates
      .filter((tenant) => {
        if (!tenant.submittedAt) return true;
        const submittedAt = new Date(tenant.submittedAt);
        return Number.isNaN(submittedAt.getTime()) || submittedAt < shiftStart;
      })
      .map((tenant) => tenant._id);

    if (pendingIds.length === 0) {
      return res.status(200).json({
        message: "No tenant records pending submission for this shift.",
        matchedCount: 0,
        modifiedCount: 0,
        reportId: reportId || null,
      });
    }

    const updatePayload = {
      submitted: true,
      submittedAt: now,
    };
    if (reportId) {
      updatePayload.reportId = reportId;
    }

    const result = await Tenant.updateMany(
      { _id: { $in: pendingIds } },
      { $set: updatePayload },
    );

    return res.status(200).json({
      message: "Shift tenant records marked as submitted.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      reportId: reportId || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit tenant shift records.", error: error.message });
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
    await Tenant.findByIdAndUpdate(req.params.id, { isDeleted: true, isArchived: true });
    res.status(200).json({ message: "Tenant permanently deleted " });
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

    const isPermanent = req.body.tenantType === "Permanent";
    const advancePayment = isPermanent ? Number(req.body.advancePaymentBalance || 0) : 0;
    
    const rentAmt = Number(req.body.rentAmount) || 0;
    const utilAmt = req.body.utilityAmount || 0;
    const recurringTotal = rentAmt + utilAmt; 
    const initialPaymentAmount = isPermanent ? (advancePayment + utilAmt) : recurringTotal;

    const tenantData = {
        ...req.body,
        totalAmount: recurringTotal, 
        advancePaymentBalance: advancePayment,
        feeBreakdown: normalizedFeeBreakdown,
        paymentHistory: [{
            referenceNo: req.body.referenceNo || "Initial Payment",
            amount: initialPaymentAmount, 
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
1. Operating hours are from 5:00 PM to 12:00 AM.
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

            const user = await User.findOne({ email: savedTenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Welcome to IBT Stalls! 🎉", 
                    `Congratulations! You are officially the tenant of Slot ${savedTenant.slotNo}.`,
                    { route: 'stalls' }
                );
            }
        } catch (emailError) {
            console.error("Welcome email/push failed:", emailError.message);
        }
    }

    res.status(201).json(savedTenant);

  } catch (error) {
    console.error("Create Tenant Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }
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
 
    if (updateData.status === "Overdue") {
        const isNightMarket = effectiveTenantType === "Night Market";
        const chargeKey = isNightMarket ? "nightMarketChargePercentage" : "permanentChargePercentage";
        const interestKey = isNightMarket ? "nightMarketInterestPercentage" : "permanentInterestPercentage";

        const chargeSetting = await Settings.findOne({ key: chargeKey });
        const interestSetting = await Settings.findOne({ key: interestKey });

        let cPct = chargeSetting ? Number(chargeSetting.value) : 25;
        let iPct = interestSetting ? Number(interestSetting.value) : 2;

        const rent = Number(updateData.rentAmount !== undefined ? updateData.rentAmount : (oldTenant.rentAmount || 0));
        const util = updateData.utilityAmount !== undefined ? Number(updateData.utilityAmount) : Number(oldTenant.utilityAmount || 0);

        let finalCharge = 0;
        let finalInterest = 0;
        let finalTotal = 0;

        if (oldTenant.status !== "Overdue") {
           
            const n = rent + (rent * (cPct / 100));
            const x = n * (iPct / 100);
            const dueBalance = x + n;
            
            finalCharge = rent * (cPct / 100);
            finalInterest = x;
            finalTotal = dueBalance + util; 
       } else {
        
            const oldTotal = Number(oldTenant.totalAmount || 0);
            const oldCharge = Number(oldTenant.chargeAmount || 0);
            const oldInterest = Number(oldTenant.interestAmount || 0);
            const oldUtil = Number(oldTenant.utilityAmount || 0);
            const oldRent = Number(oldTenant.rentAmount || 0);

           
            if (rent === oldRent && util === oldUtil) {
                finalCharge = oldCharge;
                finalInterest = oldInterest;
                finalTotal = oldTotal;
            } else {
               
                if (oldRent > 0 && oldCharge > 0) {
                    cPct = (oldCharge / oldRent) * 100;
                }

                const pureHistoricalDebt = oldTotal - oldCharge - oldInterest - oldUtil - oldRent;
                const rentBase = pureHistoricalDebt + oldRent;
                const oldCompoundingBase = rentBase + oldCharge;

                if (oldCompoundingBase > 0 && oldInterest > 0) {
                    iPct = (oldInterest / oldCompoundingBase) * 100;
                }

                const newRentBase = pureHistoricalDebt + rent;
                const newSurcharge = rent * (cPct / 100);
                const compoundingBase = newRentBase + newSurcharge;
                const newInterest = compoundingBase * (iPct / 100);

                finalCharge = newSurcharge;
                finalInterest = newInterest;
                finalTotal = compoundingBase + newInterest + util; 
            }
        }

        updateData.chargeAmount = finalCharge;
        updateData.interestAmount = finalInterest;
        updateData.totalAmount = finalTotal;
       
    } else {
        updateData.chargeAmount = 0;
        updateData.interestAmount = 0;
        updateData.totalAmount = Number(updateData.rentAmount !== undefined ? updateData.rentAmount : (oldTenant.rentAmount || 0)) + updateData.utilityAmount;
    }

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
       
        const rent = updatedTenant.rentAmount || 0;
        const totalAmount = updatedTenant.totalAmount || rent;
        const dueDate = updatedTenant.DueDateTime ? new Date(updatedTenant.DueDateTime) : new Date();
        const computationDate = new Date();
        
        
        const lastPayment = updatedTenant.paymentHistory && updatedTenant.paymentHistory.length > 0 
          ? updatedTenant.paymentHistory.sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid))[0]
          : null;
        
        const lastPaymentMonth = lastPayment ? new Date(lastPayment.datePaid).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';
        const lastPaymentAmount = lastPayment ? lastPayment.amount : 0;
        
      
        const dueMonth = dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const currentMonth = computationDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const periodText = dueMonth === currentMonth ? dueMonth : `${dueMonth} to ${currentMonth}`;
        
       const subject = "Final Notice: Overdue Rent Payment";
       const message = `Sir/Ma'am ${updatedTenant.tenantName || updatedTenant.name},

This serves as our final notice for your settle your unpaid rent for the space you occupy at Integrated Bus Terminal which now amounts to ₱${totalAmount.toLocaleString()}, inclusive of surcharge and interests, covering the period of ${periodText}, computed as of ${computationDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. The last payment you made was on ${lastPaymentMonth} amounting to ₱${lastPaymentAmount.toLocaleString()}. No payment has been made thereafter, thus this bill.

Kindly settle your account within five (5) days from receipt hereof. Otherwise, we will forward this matter to the Office of the City Legal for appropriate legal action to the effect collection of the same.

Thank you`;

        await sendEmail({ email: updatedTenant.email, subject, message });

        const user = await User.findOne({ email: updatedTenant.email });
        if (user && user.expoPushToken) {
            await sendPushNotification(
                user.expoPushToken, 
                "Rent Overdue! ⚠️", 
                `Your rent for Slot ${updatedTenant.slotNo} is now overdue. Please settle your account immediately to avoid penalties.`,
                { route: 'stalls' }
            );
        }

      } catch (err) {
        console.error("Overdue email or push notification failed:", err.message);
      }
    }


    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Update Tenant Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }
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

    const tenants = await Tenant.find({ tenantType: "Night Market", isArchived: { $ne: true } });
    let updatedCount = 0;

    for (const t of tenants) {
        
        if (t.status === "Paid") {
            const slotCount = t.slotNo ? t.slotNo.split(',').length : 1;
            const newRent = priceValue * slotCount;
            const newTotal = newRent + (t.utilityAmount || 0);

            await Tenant.updateOne(
                { _id: t._id },
                { $set: { rentAmount: newRent, totalAmount: newTotal } }
            );
            updatedCount++;

            if (t.email) {
                try {
                    const user = await User.findOne({ email: t.email });
                    if (user && user.expoPushToken) {
                        await sendPushNotification(
                            user.expoPushToken,
                            "Rent Price Updated!",
                            `Notice: Your upcoming rental fee for Slot ${t.slotNo} has been adjusted to ₱${newRent.toLocaleString()}.`,
                            { route: 'stalls' }
                        );
                    }
                } catch (notifyErr) {
                    console.error("Push failed:", notifyErr.message);
                }
            }
        }
    }

    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Night Market" }, { preferredType: "Night Market" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: priceString }
    );

    res.status(200).json({
      message: `Updated global night market price. Modified ${updatedCount} active tenants and ${applicationResult.modifiedCount} pending applications.`,
      tenantModifiedCount: updatedCount,
      applicationModifiedCount: applicationResult.modifiedCount 
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

    const tenants = await Tenant.find({ 
      $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }], 
      isArchived: { $ne: true } 
    });
    let updatedCount = 0;

    for (const t of tenants) {
        if (t.status === "Paid") {
            const slotCount = t.slotNo ? t.slotNo.split(',').length : 1;
            const newRent = priceValue * slotCount;
            const newTotal = newRent + (t.utilityAmount || 0);

            await Tenant.updateOne(
                { _id: t._id },
                { $set: { rentAmount: newRent, totalAmount: newTotal } }
            );
            updatedCount++;

            if (t.email) {
                try {
                    const user = await User.findOne({ email: t.email });
                    if (user && user.expoPushToken) {
                        await sendPushNotification(
                            user.expoPushToken,
                            "Rent Price Updated!",
                            `Notice: Your upcoming rental fee for Slot ${t.slotNo} has been adjusted to ₱${newRent.toLocaleString()}.`,
                            { route: 'stalls' }
                        );
                    }
                } catch (notifyErr) {
                    console.error("Push failed:", notifyErr.message);
                }
            }
        }
    }

    const applicationResult = await TenantApplication.updateMany(
      { 
        $or: [{ floor: "Permanent" }, { preferredType: "Permanent" }], 
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED'] } 
      },
      { paymentAmount: priceString }
    );

    res.status(200).json({
      message: `Updated global permanent price. Modified ${updatedCount} active tenants.`,
      tenantModifiedCount: updatedCount,
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

    const submittedRef = tenant.referenceNo || tenant.paymentReference || tenant.referenceno;
    
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

        const dueDateSetting = await Settings.findOne({ key: "permanentDueDate" });
        const targetDay = dueDateSetting ? Number(dueDateSetting.value) : 5;
        
        const daysInNextMonth = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, 0).getDate();
        currentDue.setDate(Math.min(targetDay, daysInNextMonth));
    }

    const priceKey = isNightMarket ? "defaultNightPrice" : "defaultPermanentPrice";
    const defaultPriceSetting = await Settings.findOne({ key: priceKey });
    const defaultPrice = defaultPriceSetting ? Number(defaultPriceSetting.value) : (isNightMarket ? 150 : 6000);

    const slotCount = tenant.slotNo ? tenant.slotNo.split(',').length : 1;
    const nextRentAmount = defaultPrice * slotCount;
    const nextTotalAmount = nextRentAmount + (tenant.utilityAmount || 0);
    
    const paymentRecord = {
        referenceNo: submittedRef || "N/A", 
        amount: tenant.totalAmount || tenant.rentAmount || 0, 
        datePaid: new Date().toISOString(),
        receiptUrl: tenant.documents?.proofOfReceipt || tenant.receiptUrl || "" 
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { 
          status: "Paid", 
          DueDateTime: currentDue.toISOString(),
          rentAmount: nextRentAmount,    
          totalAmount: nextTotalAmount,  
          chargeAmount: 0,               
          interestAmount: 0,    
          advanceUsedForPenalties: 0,        
          $push: { paymentHistory: paymentRecord },
          $unset: { 
              referenceNo: "",
              paymentReference: "", 
              referenceno: "",
              "documents.proofOfReceipt": "",
              receiptUrl: "" 
          }
      },
      { new: true }
    );

    if (updatedTenant.email) {
      const subject = "Payment Approved - IBT Stalls Renewal";
      const message = `Dear ${updatedTenant.tenantName},

Your renewal payment of ₱${paymentRecord.amount} has been successfully verified and approved.

DETAILS:
--------------------------------
Stall Number: ${updatedTenant.slotNo}
Reference No: ${paymentRecord.referenceNo}
Next Due Date: ${new Date(updatedTenant.DueDateTime).toLocaleDateString()}

Thank you for your continued tenancy!

Best regards,
IBT Management`;

      try {
          
          await sendEmail({
              email: updatedTenant.email,
              subject: subject,
              message: message
          });

          const user = await User.findOne({ email: updatedTenant.email });
          if (user && user.expoPushToken) {
              await sendPushNotification(
                  user.expoPushToken, 
                  "Payment Approved ✅", 
                  `Your renewal payment of ₱${paymentRecord.amount} for Slot ${updatedTenant.slotNo} was approved!`,
                  { route: 'stalls' }
              );
          }
      } catch (notifyError) {
          console.error("Renewal approval notifications failed:", notifyError.message);
      }
    }

    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("Approve Renewal Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Duplicate found! This Reference / OR Number is already in use." });
    }

    res.status(500).json({ error: error.message });
  }
};

export const sendRentReminder = async (req, res) => {
  try {
    const { tenantId, isOverdue } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const user = await User.findOne({ email: tenant.email });
    if (!user || !user.expoPushToken) {
      return res.status(400).json({ error: "Tenant does not have app notifications enabled." });
    }

    const amountDue = tenant.totalAmount || tenant.rentAmount || 0;
    
    const title = isOverdue ? "Rent Overdue! ⚠️" : "Rent Reminder 📅";
    const body = isOverdue 
      ? `Hi ${tenant.tenantName}, your rent of ₱${amountDue.toLocaleString()} for Slot ${tenant.slotNo} is now OVERDUE. Please pay immediately.`
      : `Hi ${tenant.tenantName}, your rent of ₱${amountDue.toLocaleString()} for Slot ${tenant.slotNo} is due soon.`;

    await sendPushNotification(user.expoPushToken, title, body, { 
        route: 'stalls', 
        targetSlot: tenant.slotNo 
    });

    res.status(200).json({ message: "Push notification reminder sent successfully!" });
  } catch (error) {
    console.error("Rent Reminder Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getOverdueSettings = async (req, res) => {
  try {
    const pCharge = await Settings.findOne({ key: "permanentChargePercentage" });
    const pInterest = await Settings.findOne({ key: "permanentInterestPercentage" });
    const nCharge = await Settings.findOne({ key: "nightMarketChargePercentage" });
    const nInterest = await Settings.findOne({ key: "nightMarketInterestPercentage" });
    const pDueDate = await Settings.findOne({ key: "permanentDueDate" }); 

    res.status(200).json({
      permanentCharge: pCharge ? Number(pCharge.value) : 25,
      permanentInterest: pInterest ? Number(pInterest.value) : 2,
      nightMarketCharge: nCharge ? Number(nCharge.value) : 25,
      nightMarketInterest: nInterest ? Number(nInterest.value) : 2,
      permanentDueDate: pDueDate ? Number(pDueDate.value) : 5
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOverdueSettings = async (req, res) => {
  try {
    const { tenantType, chargePercentage, interestPercentage, permanentDueDate } = req.body;
    
    const isNightMarket = tenantType === "Night Market";
    const chargeKey = isNightMarket ? "nightMarketChargePercentage" : "permanentChargePercentage";
    const interestKey = isNightMarket ? "nightMarketInterestPercentage" : "permanentInterestPercentage";

    if (chargePercentage !== undefined) {
      await Settings.findOneAndUpdate(
        { key: chargeKey },
        { value: Number(chargePercentage) },
        { upsert: true }
      );
    }

    if (interestPercentage !== undefined) {
      await Settings.findOneAndUpdate(
        { key: interestKey },
        { value: Number(interestPercentage) },
        { upsert: true }
      );
    }

   if (!isNightMarket && permanentDueDate !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "permanentDueDate" }, 
        { value: Number(permanentDueDate) }, 
        { upsert: true }
      );

      const targetDay = Number(permanentDueDate);
      const permanentTenants = await Tenant.find({
        $or: [{ tenantType: "Permanent" }, { tenantType: { $exists: false } }],
        isArchived: { $ne: true }
      });

      for (const t of permanentTenants) {
        if (t.DueDateTime) {
          const currentDue = new Date(t.DueDateTime);
          
          if (!isNaN(currentDue.getTime())) {
              const daysInMonth = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, 0).getDate();
              currentDue.setDate(Math.min(targetDay, daysInMonth));
              
              await Tenant.updateOne(
                  { _id: t._id },
                  { $set: { DueDateTime: currentDue.toISOString() } }
              );
          }
        }
      }
    }

    res.status(200).json({
      message: `Overdue settings for ${tenantType} updated successfully. New rates will only apply to future overdue cycles.`,
      updatedTenants: 0
    });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const startOperation = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { operationStartDate: new Date() }, 
      { new: true }
    );
    
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (tenant.email) {
        try {
            const subject = "Green Light: Official Start of Operations";
            const message = `Dear ${tenant.tenantName || tenant.name},\n\nGreat news! Management has officially recorded today, ${new Date().toLocaleDateString()}, as your Day 1 of operations for Slot ${tenant.slotNo}.\n\nYour "Days of Operation" timeline is now active and ticking.\n\nWe wish you the best of luck and great success with your business!\n\nThank you,\nIBT Management`;

            await sendEmail({ email: tenant.email, subject, message });

            const user = await User.findOne({ email: tenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Operations Started! ", 
                    `Your official Day 1 for Slot ${tenant.slotNo} has been recorded. Good luck!`,
                    { route: 'stalls' }
                );
            }
        } catch (notifyErr) {
            console.error("Failed to send start operation notifications:", notifyErr.message);
        }
    }
   
    res.status(200).json({ message: "Operation started successfully", tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const toggleOperationStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    let actionTaken = "";

    if (tenant.isOperationPaused) {
        
        const now = new Date();
        const pauseDurationMs = now - new Date(tenant.lastPausedDate);
        const pauseDurationDays = pauseDurationMs / (1000 * 60 * 60 * 24);

        tenant.totalPausedDays += pauseDurationDays;
        tenant.isOperationPaused = false;
        tenant.lastPausedDate = null;
        actionTaken = "resumed";
    } else {
       
        tenant.isOperationPaused = true;
        tenant.lastPausedDate = new Date();
        actionTaken = "paused";
    }

    await tenant.save();

   
    if (tenant.email) {
        try {
            const subject = actionTaken === "paused" 
                ? "Notice: Lease Operations Paused" 
                : "Notice: Lease Operations Resumed";
                
            const message = actionTaken === "paused"
                ? `Dear ${tenant.tenantName || tenant.name},\n\nThis is to confirm that your operations for Slot ${tenant.slotNo} have been officially paused effective ${new Date().toLocaleDateString()}. Your "Days of Operation" counter will be frozen during this period.\n\nPlease contact management if you have any questions.\n\nThank you.`
                : `Dear ${tenant.tenantName || tenant.name},\n\nThis is to confirm that your operations for Slot ${tenant.slotNo} have been officially resumed effective ${new Date().toLocaleDateString()}. Your "Days of Operation" counter is now active again.\n\nWelcome back!\n\nThank you.`;

          
            await sendEmail({ email: tenant.email, subject, message });

           
            const user = await User.findOne({ email: tenant.email });
            if (user && user.expoPushToken) {
                const title = actionTaken === "paused" ? "Operations Paused ⏸" : "Operations Resumed ▶";
                const body = `Your operations for Slot ${tenant.slotNo} have been ${actionTaken}.`;
                
                await sendPushNotification(
                    user.expoPushToken, 
                    title, 
                    body, 
                    { route: 'stalls' }
                );
            }
        } catch (notifyErr) {
            console.error("Failed to send pause/resume notifications:", notifyErr.message);
        }
    }
   
    res.status(200).json({ message: "Operation status toggled", tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processMoveOut = async (req, res) => {
  try {
    const { tenantId, damageCost, damageRemarks, consumeDeposit } = req.body;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const damages = Number(damageCost) || 0;
    const advanceBal = tenant.advancePaymentBalance || 0;
    const unpaidDue = tenant.status === "Overdue" ? (tenant.totalAmount || 0) : 0; 
    const rentAmount = tenant.rentAmount || 0;
    
    const lastMonthDeduction = consumeDeposit ? rentAmount : 0;
    const totalDeductions = damages + unpaidDue + lastMonthDeduction;
    const finalRefund = advanceBal - totalDeductions;
    
    const moveOutDetails = {
        damageCost: damages,
        damageRemarks: damageRemarks || "None",
        lastMonthRentDeducted: lastMonthDeduction,
        unpaidDuesDeducted: unpaidDue,
        finalRefund: finalRefund > 0 ? finalRefund : 0,
        remainingDebt: finalRefund < 0 ? Math.abs(finalRefund) : 0
    };

    const moveOutTransaction = {
        referenceNo: "MOVE-OUT-SETTLEMENT",
        amount: finalRefund > 0 ? finalRefund : 0, 
        datePaid: new Date().toISOString(),
        receiptUrl: "Settlement"
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, {
        status: "Moved Out",
        isArchived: true, 
        slotNo: `${tenant.slotNo} (Archived)`, 
        moveOutDate: new Date().toISOString(),
        moveOutDetails: moveOutDetails,
        $push: { paymentHistory: moveOutTransaction }
    }, { new: true, runValidators: false });

    await TenantApplication.findOneAndUpdate(
        { targetSlot: tenant.slotNo, status: "TENANT" },
        { 
            status: "MOVED OUT",
            $set: {
                moveOutDetails: moveOutDetails,
                advancePaymentBalance: advanceBal
            }
        },
        { strict: false } 
    );
   
    if (updatedTenant.email) {
        try {
            const subject = "Lease Termination & Final Accounting - IBT Stalls";
            let message = `Dear ${updatedTenant.tenantName || updatedTenant.name},\n\nThis confirms your official move-out and lease termination.\n\nFINAL ACCOUNTING:\nAdvance Deposit: ₱${advanceBal.toLocaleString()}\n`;
            
            if (consumeDeposit) message += `Less Last Month's Rent: ₱${lastMonthDeduction.toLocaleString()}\n`;
            message += `Less Damages: ₱${damages.toLocaleString()}\n`;
            if (unpaidDue > 0) message += `Less Unpaid Dues: ₱${unpaidDue.toLocaleString()}\n`;
            
            message += `\nFINAL REFUND AMOUNT: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}\n`;
            
            if (finalRefund < 0) {
                message += `\nNote: You have an outstanding remaining debt of ₱${Math.abs(finalRefund).toLocaleString()} which must be settled.`;
            } else if (finalRefund > 0 && damages === 0 && unpaidDue === 0 && !consumeDeposit) {
                message += `\nGood news! Since you have no accumulated damages or unpaid dues, your advance payment is fully refunded.`;
            } else if (consumeDeposit) {
                message += `\nYour advance deposit was successfully used to cover your last month's rent as requested.`;
            }
            
            message += `\n\nThank you for doing business with IBT.`;

            await sendEmail({ email: updatedTenant.email, subject, message });

            const user = await User.findOne({ email: updatedTenant.email });
            if (user && user.expoPushToken) {
                let pushTitle = "Move-Out Confirmed 📦";
                let pushBody = `Your lease for Slot ${updatedTenant.slotNo.replace(' (Archived)', '')} is terminated. Final Refund: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}.`;
                
                if (consumeDeposit) pushBody = `Deposit used for last month's rent. Final Refund: ₱${(finalRefund > 0 ? finalRefund : 0).toLocaleString()}.`;
                if (finalRefund < 0) pushBody = `Move out processed. You have a remaining debt of ₱${Math.abs(finalRefund).toLocaleString()}.`;
                
                await sendPushNotification(user.expoPushToken, pushTitle, pushBody, { route: 'stalls' });
            }

        } catch (emailErr) {
            console.error("Failed to send move-out notifications:", emailErr.message);
        }
    }

    res.status(200).json({ message: "Move-out processed successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("Move Out Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const rejectRenewalPayment = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const isPastDue = tenant.DueDateTime && new Date(tenant.DueDateTime) < new Date();
    const revertedStatus = isPastDue ? "Overdue" : "Paid";

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { 
          status: revertedStatus, 
          $unset: { 
              paymentReference: "", 
              referenceNo: "",
              referenceno: "",
              "documents.proofOfReceipt": "",
              receiptUrl: "" 
          }
      },
      { new: true }
    );

    if (updatedTenant.email) {
        try {
            const subject = "Payment Rejected - IBT Stalls Renewal";
            const message = `Dear ${updatedTenant.tenantName || updatedTenant.name},\n\nYour recent renewal payment receipt could not be verified and has been REJECTED.\n\nReason for rejection: ${rejectionReason || "Invalid or unreadable receipt."}\n\nPlease log in to the mobile app and submit a valid payment receipt immediately to avoid penalties.\n\nThank you,\nIBT Management`;
            
            await sendEmail({ email: updatedTenant.email, subject, message });

            const user = await User.findOne({ email: updatedTenant.email });
            if (user && user.expoPushToken) {
                await sendPushNotification(
                    user.expoPushToken, 
                    "Payment Rejected ", 
                    `Your renewal payment was rejected. Reason: ${rejectionReason}. Please submit a valid receipt.`,
                    { route: 'stalls' }
                );
            }
        } catch (emailErr) {
            console.error("Failed to send rejection email:", emailErr.message);
        }
    }

    res.status(200).json({ message: "Renewal rejected successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("Reject Renewal Error:", error);
    res.status(500).json({ error: error.message });
  }
};