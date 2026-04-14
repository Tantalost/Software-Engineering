import React, { useEffect, useMemo, useState } from "react";
import { X, FileText, Search, Loader2, ChevronDown } from "lucide-react";
import AvailableContractsModal from "./AvailableContractsModal";

const toDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const normalizeContractType = (value) => {
  return String(value || "").toUpperCase() === "INITIAL" ? "INITIAL" : "RENEWAL";
};

const resolveActiveContract = (tenant) => {
  if (Array.isArray(tenant.contracts) && tenant.contracts.length > 0) {
    const byId = tenant.activeContractId
      ? tenant.contracts.find((contract) => String(contract._id) === String(tenant.activeContractId))
      : null;

    const byStatus = tenant.contracts.find((contract) => contract.status === "active");
    const fallback = tenant.contracts[tenant.contracts.length - 1];

    return byId || byStatus || fallback;
  }

  if (tenant.StartDateTime || tenant.DueDateTime || tenant.documents?.contract) {
    return {
      contractType: "INITIAL",
      duration: { years: 0, months: 0 },
      durationMonths: null,
      startDate: tenant.StartDateTime,
      endDate: tenant.DueDateTime,
      status: "active",
      documentUrl: tenant.documents?.contract || "",
    };
  }

  return null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getRenewalCountdown = (endDateValue) => {
  if (!endDateValue) {
    return {
      daysLeft: null,
      isWithinOneMonth: false,
      isExpired: false,
    };
  }

  const endDate = new Date(endDateValue);
  if (Number.isNaN(endDate.getTime())) {
    return {
      daysLeft: null,
      isWithinOneMonth: false,
      isExpired: false,
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const daysLeft = Math.ceil((endStart.getTime() - todayStart.getTime()) / MS_PER_DAY);

  return {
    daysLeft,
    isWithinOneMonth: daysLeft >= 0 && daysLeft <= 30,
    isExpired: daysLeft < 0,
  };
};

const getDocUrl = (apiUrl, filename) => {
  if (!filename) return "";
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${apiUrl}/stalls/doc/${filename}`;
};

const isContractEligibleTenant = (tenant) => {
  const tenantType = tenant?.tenantType || tenant?.floor || "Permanent";
  return tenantType !== "Night Market";
};

const ContractsOverviewModal = ({ isOpen, onClose, tenants = [], onManageTenant, apiUrl, onNotify }) => {
  const [search, setSearch] = useState("");
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState("");

  const fetchDefaultConfig = async () => {
    setLoadingDefault(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/contracts/default-config`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load default contract config.");
      }
      const data = await response.json();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
      setDefaultTemplateId(data.defaultTemplateId || "");
    } catch (error) {
      onNotify?.("error", error.message || "Failed to load default contract config.");
    } finally {
      setLoadingDefault(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchDefaultConfig();
  }, [isOpen]);

  const selectedDefaultTemplate = useMemo(() => {
    if (!defaultTemplateId) return null;
    return templates.find((template) => String(template._id) === String(defaultTemplateId)) || null;
  }, [templates, defaultTemplateId]);

  const handleSaveDefaultTemplate = async () => {
    setSavingDefault(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/contracts/default-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: defaultTemplateId || "" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save default contract template.");
      }

      onNotify?.("success", "Default contract for mobile applicants updated.");
      await fetchDefaultConfig();
    } catch (error) {
      onNotify?.("error", error.message || "Failed to save default template.");
    } finally {
      setSavingDefault(false);
    }
  };

  const contractEligibleTenants = useMemo(
    () => tenants.filter(isContractEligibleTenant),
    [tenants]
  );

  const rows = useMemo(() => {
    const base = contractEligibleTenants.map((tenant) => {
      const active = resolveActiveContract(tenant);
      return {
        tenant,
        active,
      };
    });

    const query = search.trim().toLowerCase();
    if (!query) return base;

    return base.filter(({ tenant, active }) => {
      const haystack = [
        tenant.tenantName,
        tenant.name,
        tenant.slotNo,
        tenant.tenantType,
        normalizeContractType(active?.contractType),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [contractEligibleTenants, search]);

  const oneMonthLeftCount = useMemo(() => {
    return rows.reduce((count, { active }) => {
      const renewalMeta = getRenewalCountdown(active?.endDate);
      return renewalMeta.isWithinOneMonth ? count + 1 : count;
    }, 0);
  }, [rows]);

  const activeContractsCount = useMemo(() => {
    return rows.reduce((count, { active }) => (active ? count + 1 : count), 0);
  }, [rows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
   
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Tenant Contracts Overview</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              View all tenants and their currently active contract details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

        <div className="p-4 border-b border-slate-100 bg-slate-50/60"></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Default Contract For Mobile Applicants</p>
                <h4 className="text-lg font-bold text-slate-800">New Tenant Application Contract</h4>
                <p className="text-sm text-slate-500 mt-1">This default template is shown/used for incoming mobile applications.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-semibold hover:bg-emerald-100"
                >
                  View All Available Contracts
                </button>
              </div>
            </div>

            {loadingDefault ? (
              <div className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading default contract configuration...
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3 items-end">
                  <div className="xl:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Default Template</label>
                    <div className="relative mt-1">
                      <select
                        value={defaultTemplateId}
                        onChange={(e) => setDefaultTemplateId(e.target.value)}
                        className="w-full h-11 rounded-lg border border-slate-300 px-3 pr-10 text-sm appearance-none cursor-pointer bg-white"
                      >
                        <option value="">No default template</option>
                        {templates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {normalizeContractType(template.contractType)} ({template.duration?.years || 0}y {template.duration?.months || 0}m)
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSaveDefaultTemplate}
                      disabled={savingDefault || loadingDefault}
                      className="w-full h-11 rounded-lg bg-emerald-600 text-white px-3 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                     {savingDefault ? "Saving..." : "Save Default"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  {selectedDefaultTemplate ? (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Type</p>
                      <p className="font-semibold text-slate-700">{normalizeContractType(selectedDefaultTemplate.contractType)}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 md:col-span-2">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Duration</p>
                        <p className="font-semibold text-slate-700">{(selectedDefaultTemplate.duration?.years || 0)}y {(selectedDefaultTemplate.duration?.months || 0)}m ({selectedDefaultTemplate.durationMonths || 0} months)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-500">
                      No default contract template selected yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Tenant Contracts Overview</p>
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by tenant, slot, type, contract..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Showing</p>
                <p className="text-sm font-semibold text-slate-700">{rows.length} of {contractEligibleTenants.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Contracts</p>
                <p className="text-sm font-semibold text-emerald-800">{activeContractsCount}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Renewal Watch</p>
                <p className="text-sm font-semibold text-amber-800">{oneMonthLeftCount} tenant{oneMonthLeftCount === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pt-3">
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
            {rows.length > 0 ? (
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-3 py-2.5">Tenant</th>
                    <th className="text-left px-3 py-2.5">Slot</th>
                    <th className="text-left px-3 py-2.5">Type</th>
                    <th className="text-left px-3 py-2.5">Active Contract</th>
                    <th className="text-left px-3 py-2.5">Duration</th>
                    <th className="text-left px-3 py-2.5">Period</th>
                    <th className="text-left px-3 py-2.5">Renewal Watch</th>
                    <th className="text-left px-3 py-2.5">Document</th>
                    <th className="text-right px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ tenant, active }) => {
                    const docUrl = getDocUrl(apiUrl, active?.documentUrl || "");
                    const renewalMeta = getRenewalCountdown(active?.endDate);
                    return (
                      <tr
                        key={tenant._id || tenant.id}
                        className={`border-t border-slate-100 even:bg-slate-50/40 ${renewalMeta.isWithinOneMonth ? "bg-amber-50/60" : ""}`}
                      >
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{tenant.tenantName || tenant.name || "-"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{tenant.slotNo || "-"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{tenant.tenantType || "-"}</td>
                        <td className="px-3 py-2.5">
                          {active ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[11px] font-bold">
                              {normalizeContractType(active.contractType)}
                            </span>
                          ) : (
                            <span className="text-slate-400">No active contract</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {active
                            ? `${active.duration?.years || 0}y ${active.duration?.months || 0}m${active.durationMonths ? ` (${active.durationMonths}m)` : ""}`
                            : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          {active ? `${toDateLabel(active.startDate)} - ${toDateLabel(active.endDate)}` : "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          {!active || renewalMeta.daysLeft === null ? (
                            <span className="text-slate-400">-</span>
                          ) : renewalMeta.isExpired ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-1 text-[11px] font-bold whitespace-nowrap">
                              Expired {Math.abs(renewalMeta.daysLeft)}d ago
                            </span>
                          ) : renewalMeta.isWithinOneMonth ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-[11px] font-bold whitespace-nowrap">
                              1 month left ({renewalMeta.daysLeft}d)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold whitespace-nowrap">
                              {renewalMeta.daysLeft}d left
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {docUrl ? (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                            >
                              <FileText size={14} />
                              View
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => onManageTenant?.(tenant)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-semibold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full min-h-[220px] flex items-center justify-center text-slate-500 px-6 text-center">
                No tenants found for your search.
              </div>
          )}
          </div>
        </div>

        <AvailableContractsModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          apiUrl={apiUrl}
          onNotify={onNotify}
          onSaved={fetchDefaultConfig}
        />
      </div>
    </div>
  );
};

export default ContractsOverviewModal;
