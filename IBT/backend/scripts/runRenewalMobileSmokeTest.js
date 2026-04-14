import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Tenant from "../models/Tenant.js";
import Settings from "../models/Settings.js";
import Notification from "../models/Notification.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:10000";
const TEST_SLOT_PREFIX = "TEST-RENEW";

const assertEnv = () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }
};

const createTestTenant = async (label) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 2);

  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const activeContractId = new mongoose.Types.ObjectId();
  const testSlot = `${TEST_SLOT_PREFIX}-${label}-${Date.now()}`;

  const tenant = new Tenant({
    tenantName: "Renewal Smoke Test Tenant",
    email: `renewal-smoke-${Date.now()}@example.com`,
    contactNo: "09123456789",
    slotNo: testSlot,
    tenantType: "Permanent",
    rentAmount: 0,
    utilityAmount: 0,
    totalAmount: 0,
    status: "Paid",
    StartDateTime: startDate,
    DueDateTime: endDate,
    activeContractId,
    contracts: [
      {
        _id: activeContractId,
        contractType: "INITIAL",
        startDate,
        endDate,
        durationMonths: 3,
        duration: { years: 0, months: 3 },
        documentUrl: "",
        status: "active",
        source: "admin",
        assignedAt: new Date(),
        notes: "Smoke test baseline contract",
      },
    ],
    isEligibleForRenewal: true,
  });

  await tenant.save();
  return tenant;
};

const pickTemplateId = async () => {
  const templatesSetting = await Settings.findOne({ key: "tenantContractTemplates" });
  const templates = Array.isArray(templatesSetting?.value) ? templatesSetting.value : [];
  if (templates.length === 0) {
    throw new Error("No contract templates found in Settings(tenantContractTemplates).");
  }
  return String(templates[0]._id);
};

const deleteGridFsFileByName = async (filename) => {
  if (!filename) return;
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
  const files = await bucket.find({ filename }).toArray();
  for (const file of files) {
    await bucket.delete(file._id);
  }
};

const cleanup = async ({ tenantIds = [], uploadedFilenames = [], slotNos = [] }) => {
  for (const filename of uploadedFilenames) {
    await deleteGridFsFileByName(filename);
  }

  if (tenantIds.length > 0) {
    await Tenant.deleteMany({ _id: { $in: tenantIds } });
  }

  if (slotNos.length > 0) {
    for (const slotNo of slotNos) {
      await Notification.deleteMany({
        $or: [
          {
            title: "Renewal Contract Submitted",
            message: { $regex: slotNo, $options: "i" },
          },
          {
            title: "Renewal Payment Uploaded",
            message: { $regex: slotNo, $options: "i" },
          },
        ],
      });
    }
  }
};

const main = async () => {
  assertEnv();

  const tenantIds = [];
  const slotNos = [];
  const uploadedFilenames = [];

  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const templateId = await pickTemplateId();

    const token = jwt.sign(
      { id: "renewal-smoke-user", role: "tenant" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const paymentTenant = await createTestTenant("PAY");
    const paymentTenantId = String(paymentTenant._id);
    const paymentRef = `SMOKE-REF-${Date.now()}`;

    tenantIds.push(paymentTenantId);
    slotNos.push(paymentTenant.slotNo);

    const renewalPaymentForm = new FormData();
    renewalPaymentForm.append("tenantId", paymentTenantId);
    renewalPaymentForm.append("paymentReference", paymentRef);
    renewalPaymentForm.append(
      "receipt",
      new Blob(["Renewal payment smoke receipt\n"], { type: "application/pdf" }),
      "renewal-payment-smoke.pdf"
    );

    const paymentResponse = await fetch(`${API_BASE_URL}/api/stalls/pay-renewal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: renewalPaymentForm,
    });

    const paymentBody = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) {
      throw new Error(`Renewal payment failed (${paymentResponse.status}): ${JSON.stringify(paymentBody)}`);
    }

    const paymentTenantAfter = await Tenant.findById(paymentTenantId).lean();
    if (!paymentTenantAfter || String(paymentTenantAfter.status) !== "Payment Review") {
      throw new Error("Renewal payment endpoint succeeded but tenant status is not Payment Review.");
    }
    if (String(paymentTenantAfter.referenceNo || "") !== paymentRef) {
      throw new Error("Renewal payment endpoint succeeded but payment reference was not stored.");
    }

    const paymentReceiptFilename = String(paymentTenantAfter.documents?.proofOfReceipt || "");
    if (!paymentReceiptFilename) {
      throw new Error("Renewal payment endpoint succeeded but receipt file was not stored.");
    }
    uploadedFilenames.push(paymentReceiptFilename);

    const contractTenant = await createTestTenant("CONTRACT");
    const contractTenantId = String(contractTenant._id);

    tenantIds.push(contractTenantId);
    slotNos.push(contractTenant.slotNo);

    const contractForm = new FormData();
    contractForm.append("tenantId", contractTenantId);
    contractForm.append("templateId", templateId);
    contractForm.append(
      "contract",
      new Blob(["Renewal contract smoke payload\n"], { type: "application/pdf" }),
      "renewal-contract-smoke.pdf"
    );

    const response = await fetch(`${API_BASE_URL}/api/stalls/renew-contract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: contractForm,
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Renewal request failed (${response.status}): ${JSON.stringify(responseBody)}`);
    }

    const refreshedTenant = await Tenant.findById(contractTenantId).lean();
    const pendingContract = (refreshedTenant?.contracts || []).find(
      (contract) => String(contract.status) === "pending_approval" && String(contract.contractType) === "RENEWAL"
    );

    if (!pendingContract) {
      throw new Error("Renewal endpoint returned success but pending_approval renewal contract was not created.");
    }

    const uploadedFilename = pendingContract.documentUrl || "";
    if (uploadedFilename) {
      uploadedFilenames.push(uploadedFilename);
    }

    console.log("SMOKE TEST RESULT: PASS");
    console.log(`Payment tenant: ${paymentTenantId}`);
    console.log(`Payment receipt: ${paymentReceiptFilename}`);
    console.log(`Contract tenant: ${contractTenantId}`);
    console.log(`Template: ${templateId}`);
    console.log(`Pending renewal contract id: ${pendingContract._id}`);
    console.log(`Uploaded file: ${uploadedFilename || "(none)"}`);

    await cleanup({ tenantIds, uploadedFilenames, slotNos });
    console.log("Cleanup: completed");
  } catch (error) {
    console.error("SMOKE TEST RESULT: FAIL");
    console.error(error.message || error);

    try {
      await cleanup({ tenantIds, uploadedFilenames, slotNos });
      console.log("Cleanup after failure: completed");
    } catch (cleanupError) {
      console.error("Cleanup after failure: error", cleanupError.message || cleanupError);
    }

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

main();
