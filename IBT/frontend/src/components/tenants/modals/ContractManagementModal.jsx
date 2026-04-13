import React, { useEffect, useMemo, useState } from "react";
import { X, FileText, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";

const getDocUrl = (apiUrl, filename) => {
  if (!filename) return "";
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${apiUrl}/stalls/doc/${filename}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const normalizeContractType = (value) => {
  return String(value || "").toUpperCase() === "INITIAL" ? "INITIAL" : "RENEWAL";
};

const displayContractType = (value) => normalizeContractType(value);

const defaultForm = {
  contractType: "RENEWAL",
  startDate: "",
  endDate: "",
  durationYears: "0",
  durationMonths: "1",
  notes: "",
  makeActive: true,
  contractFile: null,
};

const ContractManagementModal = ({ isOpen, onClose, tenant, apiUrl, onSaved, onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [activeContractId, setActiveContractId] = useState("");
  const [editingContractId, setEditingContractId] = useState("");
  const [form, setForm] = useState(defaultForm);

  const tenantId = tenant?._id || tenant?.id || "";

  const activeContract = useMemo(() => {
    if (!contracts.length || !activeContractId) return null;
    return contracts.find((contract) => String(contract._id) === String(activeContractId)) || null;
  }, [contracts, activeContractId]);

  const resetForm = () => {
    setEditingContractId("");
    setForm(defaultForm);
  };

  const fetchContracts = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/${tenantId}/contracts`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load contracts.");
      }
      const data = await response.json();
      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setActiveContractId(data.activeContractId || "");
    } catch (error) {
      onNotify?.("error", error.message || "Unable to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    fetchContracts();
  }, [isOpen, tenantId]);

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const beginEdit = (contract) => {
    setEditingContractId(contract._id);
    setForm({
      contractType: normalizeContractType(contract.contractType),
      startDate: toDateInput(contract.startDate),
      endDate: toDateInput(contract.endDate),
      durationYears: String(contract.duration?.years ?? Math.floor((contract.durationMonths || 1) / 12)),
      durationMonths: String(contract.duration?.months ?? ((contract.durationMonths || 1) % 12)),
      notes: contract.notes || "",
      makeActive: String(contract._id) === String(activeContractId),
      contractFile: null,
    });
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!editingContractId) {
      onNotify?.("error", "Select a contract to edit.");
      return;
    }
    if (!form.startDate) {
      onNotify?.("error", "Contract start date is required.");
      return;
    }

    const durationYears = Number(form.durationYears || 0);
    const durationMonths = Number(form.durationMonths || 0);
    if ((!form.endDate || form.endDate.trim() === "") && durationYears + durationMonths <= 0) {
      onNotify?.("error", "Provide end date or a valid duration (months/years).");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("contractType", form.contractType);
      payload.append("startDate", form.startDate);
      if (form.endDate) payload.append("endDate", form.endDate);
      payload.append("durationYears", String(Number(form.durationYears || 0)));
      payload.append("durationMonths", String(Number(form.durationMonths || 0)));
      payload.append("notes", form.notes || "");
      payload.append("makeActive", String(Boolean(form.makeActive)));
      if (form.contractFile instanceof File) {
        payload.append("contract", form.contractFile);
      }

      const endpoint = `${apiUrl}/tenants/${tenantId}/contracts/${editingContractId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save contract.");
      }

      onNotify?.("success", "Contract updated.");
      resetForm();
      await fetchContracts();
      await onSaved?.();
    } catch (error) {
      onNotify?.("error", error.message || "Failed to save contract.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contractId) => {
    if (!tenantId || !contractId) return;

    const confirmed = window.confirm("Delete this contract record?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/${tenantId}/contracts/${contractId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete contract.");
      }
      onNotify?.("success", "Contract deleted.");
      await fetchContracts();
      await onSaved?.();
    } catch (error) {
      onNotify?.("error", error.message || "Failed to delete contract.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Contract Management</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {tenant.tenantName || tenant.name} | Slot {tenant.slotNo || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 p-4 overflow-y-auto">
          <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-700">Existing Contracts</h4>
              <button
                onClick={fetchContracts}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="overflow-auto max-h-[58vh]">
              {loading ? (
                <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading contracts...
                </div>
              ) : contracts.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No contracts yet for this tenant.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Duration</th>
                      <th className="text-left px-3 py-2">Period</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Doc</th>
                      <th className="text-right px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => {
                      const isActive = String(contract._id) === String(activeContractId);
                      const docUrl = getDocUrl(apiUrl, contract.documentUrl);

                      return (
                        <tr key={contract._id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-700">{displayContractType(contract.contractType)}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {(contract.duration?.years || 0)}y {(contract.duration?.months || 0)}m
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                              {isActive ? "ACTIVE" : (contract.status || "inactive").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {docUrl ? (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                              >
                                <FileText size={14} /> View
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                                title="Edit"
                                onClick={() => beginEdit(contract)}
                                disabled={saving}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                title="Delete"
                                onClick={() => handleDelete(contract._id)}
                                disabled={saving}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              Current active contract: {activeContract ? `${formatDate(activeContract.startDate)} to ${formatDate(activeContract.endDate)}` : "None"}
            </div>
          </section>

          <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-700 mb-3">{editingContractId ? "Edit Contract" : "Select a Contract"}</h4>

            {!editingContractId ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Select an existing contract from the table to edit it. Only edit and delete are allowed in this module.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Contract Type</label>
                    <select
                      value={form.contractType}
                      onChange={(e) => handleFormChange("contractType", normalizeContractType(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="INITIAL">INITIAL</option>
                      <option value="RENEWAL">RENEWAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleFormChange("startDate", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">End Date (optional if duration provided)</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => handleFormChange("endDate", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Years</label>
                      <input
                        type="number"
                        min="0"
                        value={form.durationYears}
                        onChange={(e) => handleFormChange("durationYears", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Months</label>
                      <input
                        type="number"
                        min="0"
                        value={form.durationMonths}
                        onChange={(e) => handleFormChange("durationMonths", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Contract Document (PDF/Image)</label>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => handleFormChange("contractFile", e.target.files?.[0] || null)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => handleFormChange("notes", e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(form.makeActive)}
                      onChange={(e) => handleFormChange("makeActive", e.target.checked)}
                      className="h-4 w-4"
                    />
                    Set as active contract
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                  <button
                    onClick={resetForm}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-sm"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContractManagementModal;
