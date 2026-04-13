import React, { useState } from "react";
import Input from "../common/Input";

const EditLostFound = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id || row._id,
    trackingNo: row.trackingno || row.trackingNo,
    location: row.location || "",
    dateTime: row.datetime || row.dateTime,
    status: row.status,
    claimedBy: row.claimedBy || "",
  });
  
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSaveClick = () => {
    if (form.status === "Claimed") {
      if (!form.claimedBy || form.claimedBy.trim() === "") {
        setErrorMsg("Please enter the name of the person who claimed the item.");
        return;
      }
      if (!evidencePhoto) {
        setErrorMsg("Please upload photo evidence of the claim to proceed.");
        return;
      }
    }

    setErrorMsg("");
    onSave({ 
      id: form.id, 
      trackingNo: form.trackingNo, 
      location: form.location,
      dateTime: form.dateTime, 
      status: form.status,
      claimedBy: form.claimedBy,
      evidencePhoto: evidencePhoto 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-bold text-slate-800">Edit Record</h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {["Unclaimed", "Claimed"].map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setForm({ ...form, status })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  form.status === status
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Tracking No"
            value={form.trackingNo}
            onChange={(e) => set("trackingNo", e.target.value)}
          />

          <Input
            label="DateTime"
            value={form.dateTime}
            onChange={(e) => set("dateTime", e.target.value)}
          />

          <div className="md:col-span-2">
             <Input
               label="Location"
               value={form.location}
               onChange={(e) => set("location", e.target.value)}
             />
          </div>

          {form.status === "Claimed" && (
            <>
              <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4">
                <Input
                  label="Claimed By *"
                  value={form.claimedBy}
                  onChange={(e) => set("claimedBy", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Claim Evidence (Upload ID/Proof) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    setEvidencePhoto(file || null);
                  }}
                  className="w-full text-sm text-slate-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveClick} 
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLostFound;