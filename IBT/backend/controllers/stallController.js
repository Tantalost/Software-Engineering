import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Notification from '../models/Notification.js'; 

// Helper to create notifications internally
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

// 1. Get Occupied Stalls (No changes needed here, relies on Tenant model)
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
    console.error("Error fetching occupied stalls:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Get My Application Status (UPDATED: Uses userId)
export const getMyApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Find the application first
    let application = await TenantApplication.findOne({ userId }).lean();
    
    // 2. If application exists and is approved, OR if we just want to check for existing tenant
    // We try to find the actual Tenant record to get the Dates
    const tenant = await Tenant.findOne({ 
        $or: [{ uid: userId }, { email: application?.email }] 
    }).lean();

    if (tenant) {
        // If user is a full tenant, merge tenant details (Dates) into the response
        if (!application) {
            // Create a synthetic application object if the original was deleted
            application = {
                status: 'TENANT',
                targetSlot: tenant.slotNo,
                floor: tenant.tenantType,
                start: tenant.StartDateTime,
                due: tenant.DueDateTime
            };
        } else {
            // Merge dates into existing application object
            application.status = 'TENANT'; // Ensure status is correct
            application.start = tenant.StartDateTime;
            application.due = tenant.DueDateTime;
        }
    }
    
    res.json(application || null); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Submit New Application (UPDATED: Uses userId)
export const submitApplication = async (req, res) => {
  try {
    const data = req.body; 

    // --- CHECK 1: Is the slot already fully occupied (Tenant exists)? ---
    // This handles the case where the map hasn't updated on the user's phone yet.
    const existingTenant = await Tenant.findOne({ 
        slotNo: data.targetSlot 
    });

    if (existingTenant) {
        return res.status(400).json({ message: "Sorry, this slot was just taken by another user." });
    }

    // --- CHECK 2: Is there already a PENDING application for this slot? ---
    // This prevents two people from applying for the same slot at the same time.
    const pendingApp = await TenantApplication.findOne({
        targetSlot: data.targetSlot,
        // Check for any status that implies the slot is "reserved"
        status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'] }
    });

    if (pendingApp) {
        return res.status(400).json({ message: "Someone else is currently applying for this slot. Please choose another." });
    }

    // --- IF CLEAR, PROCEED TO SAVE ---
    const newApp = await TenantApplication.findOneAndUpdate(
      { userId: data.userId },
      { ...data, status: 'VERIFICATION_PENDING' },
      { new: true, upsert: true }
    );

    await createAdminNotification(
      "New Application Received",
      `Applicant ${data.name} has applied for slot ${data.targetSlot}.`
    );

    res.json(newApp);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Submit Payment Receipt (UPDATED: Uses userId)
export const submitPayment = async (req, res) => {
  try {
    const { userId, receiptUrl, paymentReference, paymentAmount } = req.body;
    
    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId },
      { 
        receiptUrl, 
        paymentReference, 
        paymentAmount, 
        status: 'PAYMENT_REVIEW',
        paymentSubmittedAt: new Date()
      },
      { new: true }
    );

    await createAdminNotification(
      "Payment Receipt Uploaded",
      `Ref: ${paymentReference}. Verify payment for Applicant ID: ${userId.slice(-6)}.`
    );

    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Submit Contract (UPDATED: Uses userId)
export const uploadContract = async (req, res) => {
  try {
    const { userId, contractUrl } = req.body;

    if (!userId || !contractUrl) {
      return res.status(400).json({ message: "Missing userId or contractUrl" });
    }

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId },
      { 
        contractUrl, 
        status: 'CONTRACT_REVIEW', 
        contractSubmittedAt: new Date()
      },
      { new: true }
    );
    
    await createAdminNotification(
      "Contract Signed",
      "A new signed contract has been uploaded. Please review for final approval."
    );

    if (!updatedApp) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(updatedApp);
  } catch (error) {
    console.error("Contract Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};