import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import DeleteModal from "../components/common/DeleteModal";
import {
  CheckCircle,
  XCircle,
  X,
  UserX,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  Copy
} from "lucide-react";
import NotificationToast from "../components/common/NotificationToast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

const roleLabels = {
  superadmin: "Super Admin",
  parking: "Parking Admin",
  lostfound: "Lost & Found Admin",
  ticket: "Ticket Admin",
  bus: "Bus Admin",
  lease: "Lease Admin",
};

const shiftOptions = ["00-06", "06-12", "12-18", "18-24"];

export default function EmployeeManage() {
  const [admins, setAdmins] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    email: "",
    password: "",
    role: "parking",
    assignedShift: "00-06",
  });

  // Edit State
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    email: "",
    assignedShift: "00-06",
    password: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: "success",
    message: "",
    autoClose: true,
    duration: 3000,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Recovery Code State
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [newRecoveryCodes, setNewRecoveryCodes] = useState([]);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  const showToast = (type, message) => {
    setNotificationState({
      isOpen: true,
      type,
      message,
    });

    setTimeout(() => {
      setNotificationState((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  // Load admins
  useEffect(() => {
    const fetchAdmins = async () => {
      const role = localStorage.getItem("authRole");
      setIsLoading(true);
      try {
        if (role === "superadmin") {
          const res = await fetch(`${API_BASE_URL}/api/admins`);
          if (!res.ok) throw new Error("Failed to load admins");
          let data = {};
          try {
            data = await res.json();
          } catch {
            data = {};
          }
          setAdmins(
            data.map((a) => ({
              ...a,
              name: a.name || roleLabels[a.role] || "Admin",
            })),
          );
        } // <--- THIS WAS THE MISSING BRACE!
      } catch (error) {
        console.error("Error fetching admins:", error);
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to load admins.",
          autoClose: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  // Timers
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
      const timer = setTimeout(() => {
        setNotificationState({
          isOpen: false,
          type: "",
          message: "",
          autoClose: true,
        });
      }, notificationState.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [notificationState]);

  const isSuperAdmin = useMemo(
    () => (localStorage.getItem("authRole") || "superadmin") === "superadmin",
    [],
  );

  // --- Actions ---

  const addAdmin = async () => {
    if (
      !createForm.firstName.trim() ||
      !createForm.lastName.trim() ||
      !createForm.email ||
      !createForm.password
    ) {
      showToast("error", "Please fill in all required fields.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          middleName: createForm.middleName.trim() || undefined,
          suffix: createForm.suffix.trim() || undefined,
          email: createForm.email.trim(),
          role: createForm.role,
          assignedShift: createForm.assignedShift,
          password: createForm.password,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || "Failed to create admin.");

      setAdmins((prev) => [
        ...prev,
        {
          ...data.admin,
          name: data.admin.name || roleLabels[data.admin.role] || "Admin",
        },
      ]);
      setShowCreate(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        email: "",
        password: "",
        role: "parking",
        assignedShift: "00-06",
      });
      showToast("success", "Admin created successfully.");
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    if (otpTimer > 0) return;
    if (!editForm.email) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Email is required.",
        autoClose: true,
      });
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/admins/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editForm.email }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server endpoint not found (404). Check your backend routes.",
        );
      }

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");

      setOtpSent(true);
      setOtpTimer(60);
      showToast("success", "OTP sent to Super Admin email.");
    } catch (error) {
      console.error("OTP Error:", error);
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editTarget) return;

    if (editForm.password && !editForm.otp) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "OTP is required to change password.",
        autoClose: true,
      });
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        middleName: editForm.middleName,
        suffix: editForm.suffix,
        email: editForm.email,
        assignedShift: editForm.assignedShift,
      };

      if (editForm.password) {
        payload.password = editForm.password;
        payload.otp = editForm.otp;
      }

      const res = await fetch(`${API_BASE_URL}/api/admins/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || "Failed to update admin.");

      const next = admins.map((a) =>
        a.id === editTarget.id ? { ...a, ...payload, password: a.password } : a,
      );
      setAdmins(next);
      setEditTarget(null);
      setEditForm({
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        email: "",
        assignedShift: "00-06",
        password: "",
        otp: "",
      });
      setOtpSent(false);

      showToast("success", "Admin details updated successfully.");
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove admin.");

      setAdmins(admins.filter((a) => a.id !== deleteTarget.id));
      showToast("success", "Admin removed successfully.");
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditModal = (admin) => {
    setEditTarget(admin);
    setEditForm({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      middleName: admin.middleName || "",
      suffix: admin.suffix || "",
      email: admin.email || "",
      assignedShift: admin.assignedShift || "00-06",
      password: "",
      otp: "",
    });
    setOtpSent(false);
    setOtpTimer(0);
  };

  // --- RECOVERY CODES ACTIONS ---
  const handleGenerateCodes = async (e) => {
    e.preventDefault();
    if (!recoveryPassword) {
      return showToast("error", "Please enter your current password.");
    }

    setIsGeneratingCodes(true);
    setNewRecoveryCodes([]); 

    try {
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${API_BASE_URL}/api/admins/generate-recovery-codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword: recoveryPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate codes.");
      }

      setNewRecoveryCodes(data.recoveryCodes);
      showToast("success", "New recovery codes generated successfully!");
      setRecoveryPassword(""); 
      
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "System error. Please try again.");
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleCopyCodes = () => {
    const formattedCodes = newRecoveryCodes.join("\n");
    navigator.clipboard.writeText(formattedCodes);
    showToast("success", "Recovery codes copied to clipboard!");
  };

  return (
    <Layout title="Manage Employees">
      {!isSuperAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Only Super Admin can access this.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* --- ADMINS TABLE SECTION --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Manage / View Admins
              </h2>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Create Admin
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <table className="min-w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Shift</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && admins.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={5}>
                        No admins found.
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => (
                      <tr
                        key={a.id || a._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-all"
                      >
                        <td className="px-6 py-3 font-medium">{a.name}</td>
                        <td className="px-6 py-3">{a.email}</td>
                        <td className="px-6 py-3 capitalize">
                          {roleLabels[a.role] || a.role}
                        </td>
                        <td className="px-6 py-3">
                          {a.role === "superadmin" ? "N/A" : (a.assignedShift || "-")}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(a)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(a)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* --- RECOVERY CODES MANAGER SECTION --- */}
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <KeyRound size={20} className="text-emerald-600" />
                Emergency Recovery Codes
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Generate static backup codes to access your Super Admin account if you lose access to your email or are locked out by 2FA.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl shadow-sm">
              {newRecoveryCodes.length === 0 ? (
                <form onSubmit={handleGenerateCodes} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="w-full sm:w-2/3">
                       <Field
                        label="Verify Current Password"
                        type="password"
                        placeholder="Enter password to generate new codes"
                        value={recoveryPassword}
                        onChange={(e) => setRecoveryPassword(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isGeneratingCodes || !recoveryPassword}
                      className="w-full sm:w-1/3 h-[42px] bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isGeneratingCodes ? "Generating..." : "Generate Codes"}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Generating new codes will permanently invalidate your old codes.
                  </p>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                    <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-1">
                      <AlertTriangle size={18} />
                      Save these codes immediately!
                    </h4>
                    <p className="text-amber-700 text-sm">
                      Store them in a secure password manager or print them out and keep them safe. 
                      <strong> You will not be able to see them again after you leave this page.</strong>
                    </p>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-xl mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                      {newRecoveryCodes.map((code, index) => (
                        <div key={index} className="bg-slate-800 py-3 px-4 rounded-lg font-mono text-emerald-400 text-lg tracking-[0.2em] shadow-inner">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setNewRecoveryCodes([])}
                      className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      I saved them
                    </button>
                    <button
                      onClick={handleCopyCodes}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      <Copy size={18} />
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* CREATE MODAL */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
                <h3 className="mb-4 text-base font-semibold text-slate-800">
                  Create New Admin
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field
                    label="First Name *"
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        firstName: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Last Name *"
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, lastName: e.target.value })
                    }
                  />
                  <Field
                    label="Middle Name"
                    value={createForm.middleName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        middleName: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Suffix"
                    value={createForm.suffix}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, suffix: e.target.value })
                    }
                  />
                  <Field
                    label="Email *"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                  />
                  <Field
                    label="Password *"
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                  />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Role *
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, role: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
                    >
                      {/* FILTER APPLIED HERE: Prevents "Super Admin" from being an option */}
                      {Object.keys(roleLabels)
                        .filter((role) => role !== "superadmin")
                        .map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Assigned Shift *
                    </label>
                    <select
                      value={createForm.assignedShift}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          assignedShift: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
                    >
                      {shiftOptions.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAdmin}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT MODAL */}
          {editTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg overflow-y-auto max-h-[90vh]">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Edit Admin Details
                </h3>
                <div className="space-y-4">
                  <Field
                    label="First Name"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                  />
                  <Field
                    label="Last Name"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                  />
                  <Field
                    label="Middle Name"
                    value={editForm.middleName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, middleName: e.target.value })
                    }
                  />
                  <Field
                    label="Suffix"
                    value={editForm.suffix}
                    onChange={(e) =>
                      setEditForm({ ...editForm, suffix: e.target.value })
                    }
                  />
                  <Field
                    label="Email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Assigned Shift
                    </label>
                    <select
                      value={editForm.assignedShift}
                      onChange={(e) =>
                        setEditForm({ ...editForm, assignedShift: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
                    >
                      {shiftOptions.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Change Password{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={editForm.password}
                      onChange={(e) =>
                        setEditForm({ ...editForm, password: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  {editForm.password.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold mb-2">
                        <ShieldCheck size={16} />
                        Security Verification Required
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter OTP Code"
                          value={editForm.otp}
                          disabled={!otpSent}
                          onChange={(e) =>
                            setEditForm({ ...editForm, otp: e.target.value })
                          }
                          className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm outline-none"
                        />
                        <button
                          onClick={requestOtp}
                          disabled={otpTimer > 0 || isLoading}
                          className={`px-3 py-2 rounded-md text-xs font-medium text-white shadow-sm flex items-center gap-1 transition-all
                                                        ${otpTimer > 0 ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}
                        >
                          {otpTimer > 0
                            ? `Resend (${otpTimer}s)`
                            : otpSent
                              ? "Resend OTP"
                              : "Send OTP"}
                          {!otpTimer && <Send size={12} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-blue-600/80 mt-1">
                        Changing a password requires OTP verification. Check
                        your registered email.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setEditTarget(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAdmin}
                    disabled={
                      isLoading ||
                      (editForm.password.length > 0 && !editForm.otp)
                    }
                    className={`rounded-lg px-4 py-2 text-sm text-white shadow transition-all flex items-center gap-2
                                            ${editForm.password.length > 0 && !editForm.otp ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Admin Account"
        icon={<UserX size={28} className="text-red-500" />}
        message={`Are you sure you want to PERMANENTLY remove the admin account for ${deleteTarget?.email}?`}
        itemName={deleteTarget?.email || ""}
      />

      <NotificationToast
        isOpen={notificationState.isOpen}
        type={notificationState.type}
        message={notificationState.message}
        onClose={() =>
          setNotificationState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </Layout>
  );
}

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (isVisible ? "text" : "password") : type;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <div className="relative">
        <input
          disabled={disabled}
          value={value}
          onChange={onChange}
          type={inputType}
          placeholder={placeholder}
          className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-700 shadow-sm outline-none focus:border-emerald-500 transition-colors ${disabled ? "opacity-70" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};