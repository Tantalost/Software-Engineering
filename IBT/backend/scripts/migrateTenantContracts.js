import "dotenv/config";
import mongoose from "mongoose";
import Tenant from "../models/Tenant.js";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const tenantIdArg = args.find((arg) => arg.startsWith("--tenantId="));

const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
const tenantId = tenantIdArg ? tenantIdArg.split("=")[1] : null;

const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ensureEndDate = (startDate, candidateEndDate) => {
  const endDate = toValidDate(candidateEndDate);
  if (!endDate || endDate <= startDate) {
    const fallback = new Date(startDate);
    fallback.setMonth(fallback.getMonth() + 1);
    return fallback;
  }
  return endDate;
};

const calculateDurationMonths = (startDate, endDate) => {
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (endDate.getDate() >= startDate.getDate()) {
    months += 1;
  }

  return Math.max(months, 1);
};

const splitDuration = (durationMonths) => ({
  years: Math.floor(durationMonths / 12),
  months: durationMonths % 12
});

const flushBulkOps = async (bulkOps) => {
  if (bulkOps.length === 0) return;
  if (isDryRun) {
    bulkOps.length = 0;
    return;
  }

  await Tenant.bulkWrite(bulkOps, { ordered: false });
  bulkOps.length = 0;
};

const migrate = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing. Add it to backend/.env before running migration.");
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const query = tenantId ? { _id: tenantId } : {};
  const cursor = Tenant.find(query).cursor();

  const bulkOps = [];

  let scanned = 0;
  let updatedTenants = 0;
  let migratedLegacyContracts = 0;
  let fixedActiveContractPointers = 0;
  let linkedPaymentRows = 0;

  for await (const tenant of cursor) {
    scanned += 1;

    const hasContracts = Array.isArray(tenant.contracts) && tenant.contracts.length > 0;
    const updatePayload = {};
    let shouldUpdate = false;
    let selectedContractId = null;

    if (!hasContracts) {
      const startDate = toValidDate(tenant.StartDateTime) || toValidDate(tenant.createdAt) || new Date();
      const endDate = ensureEndDate(startDate, tenant.DueDateTime);
      const durationMonths = calculateDurationMonths(startDate, endDate);

      const legacyContractId = new mongoose.Types.ObjectId();
      const legacyContract = {
        _id: legacyContractId,
        contractType: "INITIAL",
        startDate,
        endDate,
        durationMonths,
        duration: splitDuration(durationMonths),
        documentUrl: tenant.documents?.contract || "",
        status: "active",
        source: "legacy",
        assignedAt: toValidDate(tenant.createdAt) || new Date(),
        notes: "Auto-migrated from legacy StartDateTime/DueDateTime + documents.contract fields."
      };

      updatePayload.contracts = [legacyContract];
      updatePayload.activeContractId = legacyContractId;
      selectedContractId = legacyContractId;

      migratedLegacyContracts += 1;
      shouldUpdate = true;
    } else {
      const byId = tenant.activeContractId
        ? tenant.contracts.find((contract) => String(contract._id) === String(tenant.activeContractId))
        : null;

      const byStatus = tenant.contracts.find((contract) => contract.status === "active");
      const fallback = tenant.contracts[tenant.contracts.length - 1] || null;
      const activeContract = byId || byStatus || fallback;

      if (activeContract) {
        selectedContractId = activeContract._id;
        if (!tenant.activeContractId || String(tenant.activeContractId) !== String(activeContract._id)) {
          updatePayload.activeContractId = activeContract._id;
          fixedActiveContractPointers += 1;
          shouldUpdate = true;
        }
      }
    }

    if (selectedContractId && Array.isArray(tenant.paymentHistory) && tenant.paymentHistory.length > 0) {
      let paymentHistoryTouched = false;
      let linkedCountForTenant = 0;

      const nextPaymentHistory = tenant.paymentHistory.map((entry) => {
        const plain = entry.toObject ? entry.toObject() : { ...entry };
        if (!plain.contractId) {
          paymentHistoryTouched = true;
          linkedCountForTenant += 1;
          return { ...plain, contractId: selectedContractId };
        }
        return plain;
      });

      if (paymentHistoryTouched) {
        updatePayload.paymentHistory = nextPaymentHistory;
        linkedPaymentRows += linkedCountForTenant;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      updatedTenants += 1;
      bulkOps.push({
        updateOne: {
          filter: { _id: tenant._id },
          update: { $set: updatePayload }
        }
      });
    }

    if (bulkOps.length >= 200) {
      await flushBulkOps(bulkOps);
    }

    if (limit && scanned >= limit) {
      break;
    }
  }

  await flushBulkOps(bulkOps);

  console.log("Tenant contract migration summary");
  console.log("--------------------------------");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "WRITE"}`);
  console.log(`Scanned tenants: ${scanned}`);
  console.log(`Updated tenants: ${updatedTenants}`);
  console.log(`Legacy contracts created: ${migratedLegacyContracts}`);
  console.log(`Active contract pointers repaired: ${fixedActiveContractPointers}`);
  console.log(`Payment history rows linked to a contract: ${linkedPaymentRows}`);

  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // no-op
  }
  process.exit(1);
});
