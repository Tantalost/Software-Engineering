import React, { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";

const getDocUrl = (apiUrl, filename) => {
  if (!filename) return "";
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${apiUrl}/stalls/doc/${filename}`;
};

const normalizeContractType = (value) => {
  return String(value || "").toUpperCase() === "INITIAL" ? "INITIAL" : "RENEWAL";
};

const displayContractType = (value) => normalizeContractType(value);

const defaultForm = {
  contractType: "INITIAL",
  durationYears: "0",
  durationMonths: "1",
  notes: "",
  contractFile: null,
};

const AvailableContractsModal = ({ isOpen, onClose, apiUrl, onNotify, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultForm);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/contracts/templates`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch contract templates.");
      }
      const data = await response.json();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (error) {
      onNotify?.("error", error.message || "Failed to fetch templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    fetchTemplates();
  }, [isOpen]);

  const beginEdit = (template) => {
    setEditingId(template._id);
    setForm({
      contractType: normalizeContractType(template.contractType),
      durationYears: String(template.duration?.years || 0),
      durationMonths: String(template.duration?.months || 0),
      notes: template.notes || "",
      contractFile: null,
    });
  };

  const handleSave = async () => {
    const totalMonths = (Number(form.durationYears || 0) * 12) + Number(form.durationMonths || 0);
    if (totalMonths <= 0) {
      onNotify?.("error", "Template duration must be at least 1 month.");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("contractType", form.contractType);
      payload.append("durationYears", String(Number(form.durationYears || 0)));
      payload.append("durationMonths", String(Number(form.durationMonths || 0)));
      if (editingId) {
        payload.append("notes", form.notes || "");
      }
      if (form.contractFile instanceof File) {
        payload.append("contract", form.contractFile);
      }

      const endpoint = editingId
        ? `${apiUrl}/tenants/contracts/templates/${editingId}`
        : `${apiUrl}/tenants/contracts/templates`;

      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save template.");
      }

      onNotify?.("success", editingId ? "Template updated." : "Template created.");
      resetForm();
      await fetchTemplates();
      await onSaved?.();
    } catch (error) {
      onNotify?.("error", error.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    const confirmed = window.confirm("Delete this contract template?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/tenants/contracts/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete template.");
      }

      onNotify?.("success", "Template deleted.");
      await fetchTemplates();
      await onSaved?.();
    } catch (error) {
      onNotify?.("error", error.message || "Failed to delete template.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Available Contract Templates</h3>
            <p className="text-sm text-slate-500 mt-0.5">Create, edit, and delete reusable contract templates.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 p-4 overflow-y-auto">
          <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white">
            <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700">Templates</div>
            <div className="overflow-auto max-h-[58vh]">
              {loading ? (
                <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No templates yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Duration</th>
                      <th className="text-left px-3 py-2">Document</th>
                      <th className="text-right px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => {
                      const docUrl = getDocUrl(apiUrl, template.documentUrl || "");
                      return (
                        <tr key={template._id} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-600">{displayContractType(template.contractType)}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {(template.duration?.years || 0)}y {(template.duration?.months || 0)}m ({template.durationMonths || 0}m)
                          </td>
                          <td className="px-3 py-2">
                            {docUrl ? (
                              <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold">
                                <FileText size={14} /> View
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => beginEdit(template)} title="Edit" disabled={saving}>
                                <Pencil size={15} />
                              </button>
                              <button className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100" onClick={() => handleDelete(template._id)} title="Delete" disabled={saving}>
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
          </section>

          <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-700 mb-3">{editingId ? "Edit Template" : "Create Template"}</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Contract Type</label>
                <select value={form.contractType} onChange={(e) => setForm((prev) => ({ ...prev, contractType: normalizeContractType(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="INITIAL">INITIAL</option>
                  <option value="RENEWAL">RENEWAL</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Years</label>
                  <input type="number" min="0" value={form.durationYears} onChange={(e) => setForm((prev) => ({ ...prev, durationYears: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Months</label>
                  <input type="number" min="0" value={form.durationMonths} onChange={(e) => setForm((prev) => ({ ...prev, durationMonths: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Document (PDF/Image)</label>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setForm((prev) => ({ ...prev, contractFile: e.target.files?.[0] || null }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white" />
              </div>
              {editingId && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              {editingId && (
                <button onClick={resetForm} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-sm">Cancel Edit</button>
              )}
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {editingId ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AvailableContractsModal;
