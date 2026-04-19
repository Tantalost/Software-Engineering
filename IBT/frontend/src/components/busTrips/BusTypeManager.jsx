import React, { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

const BusTypeManager = ({ isOpen, onClose, apiUrl, onChanged }) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [busTypes, setBusTypes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchBusTypes = async () => {
    if (!apiUrl) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiUrl}?active=false`);
      if (!response.ok) {
        throw new Error("Failed to load bus types.");
      }

      const data = await response.json();
      setBusTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load bus types.");
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      : {
          "Content-Type": "application/json",
        };
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchBusTypes();
  }, [isOpen, apiUrl]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Bus type name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          isActive: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to create bus type.");
      }

      setName("");
      await fetchBusTypes();
      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create bus type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (busType) => {
    if (!busType?._id) return;

    try {
      const response = await fetch(`${apiUrl}/${busType._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          isActive: !busType.isActive,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to update bus type.");
      }

      await fetchBusTypes();
      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to update bus type.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-800">Manage Bus Types</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bus type name (e.g., Deluxe, Sleeper)"
              className="sm:col-span-10 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>
        </form>

        {errorMessage && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="max-h-[45vh] overflow-auto rounded-xl border border-slate-200">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading bus types...</div>
          ) : busTypes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No bus types yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {busTypes.map((type) => (
                  <tr key={type._id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{type.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${type.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(type)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {type.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusTypeManager;
