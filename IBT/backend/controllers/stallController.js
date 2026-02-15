import Tenant from '../models/TenantS.js';
import TenantApplication from '../models/TenantApplicationS.js';
import Notification from '../models/NotificationS.js';
import { bucket } from '../server.js'; // 1. Import the shared bucket

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

// 2. Updated Submit Application to handle GridFS Files
export const submitApplication = async (req, res) => {
  try {
    const data = req.body;
    const files = req.files; // Multer-gridfs puts files here

    const existingTenant = await Tenant.findOne({ slotNo: data.targetSlot });
    if (existingTenant) return res.status(400).json({ message: "Slot already taken." });

    // Extract filenames from GridFS
    const updatedData = {
      ...data,
      businessPermit: files['businessPermit'] ? files['businessPermit'][0].filename : null,
      validID: files['validID'] ? files['validID'][0].filename : null,
      clearance: files['clearance'] ? files['clearance'][0].filename : null,
      status: 'VERIFICATION_PENDING'
    };

    const newApp = await TenantApplication.findOneAndUpdate(
      { userId: data.userId },
      updatedData,
      { new: true, upsert: true }
    );

    await createAdminNotification("New Application", `Applicant ${data.name} for slot ${data.targetSlot}.`);
    res.json(newApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Updated Payment to handle GridFS Receipt
export const submitPayment = async (req, res) => {
  try {
    const { userId, paymentReference, paymentAmount } = req.body;
    const filename = req.file ? req.file.filename : null; // single file from multer

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId },
      {
        receiptUrl: filename, // Store the filename to fetch via /api/files/:filename
        paymentReference,
        paymentAmount,
        status: 'PAYMENT_REVIEW',
        paymentSubmittedAt: new Date()
      },
      { new: true }
    );

    await createAdminNotification("Payment Uploaded", `Ref: ${paymentReference}.`);
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