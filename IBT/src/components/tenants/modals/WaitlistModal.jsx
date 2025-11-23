import React from "react";
import { X, ClipboardList, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import Input from "../../common/Input"; 
import Textarea from "../../common/Textarea"; 

const WaitlistModal = ({ 
  isOpen, onClose, 
  waitlistData, 
  showForm, setShowForm, 
  formData, setFormData, 
  onAdd, onApprove, onReject 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-emerald-600" />
              {showForm ? "Add New Applicant" : "Waitlist Applications"}
            </h3>
            <p className="text-sm text-slate-500">{showForm ? "Register an applicant." : "Review and approve pending tenant applications."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              {showForm ? "Back to List" : <><UserPlus size={14} /> Add Applicant</>}
            </button>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {showForm ? (
            <div className="space-y-4 max-w-lg mx-auto py-4">
              <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex. Juan Dela Cruz" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Contact No" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="0912 345 6789" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 ml-1">Preferred Slot</label>
                  <select
                    className="w-full rounded-lg border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                    value={formData.preferredType}
                    onChange={(e) => setFormData({ ...formData, preferredType: e.target.value })}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Night Market">Night Market</option>
                  </select>
                </div>
              </div>
              <Input label="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="juan@example.com" />
              <Textarea label="Notes / Product" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Describe what you intend to sell..." />
              <button onClick={onAdd} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save to List</button>
            </div>
          ) : (
            waitlistData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <ClipboardList size={48} className="mb-3 opacity-20" />
                <p>No pending applicants found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Applicant Name</th>
                      <th className="px-4 py-3">Contact / Email</th>
                      <th className="px-4 py-3">Preference</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitlistData.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{applicant.name}</td>
                        <td className="px-4 py-3"><div className="flex flex-col"><span>{applicant.contact}</span><span className="text-xs text-slate-400">{applicant.email}</span></div></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${applicant.preferredType === 'Permanent' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>{applicant.preferredType}</span></td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{applicant.notes || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => onReject(applicant.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors">Reject</button>
                            <button onClick={() => onApprove(applicant)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium shadow-sm transition-colors flex items-center gap-1"><CheckCircle size={14} /> Approve</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
        {!showForm && waitlistData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Approving an applicant moves them to the main table with "Pending" status. You must manually assign a Slot No later.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;