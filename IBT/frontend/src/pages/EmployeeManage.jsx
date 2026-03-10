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
  });

  // Edit State
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    email: "",
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
  });

  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admins`);
        if (!res.ok) throw new Error("Failed to load admins");
        const data = await res.json();
        setAdmins(
          data.map((a) => ({
            ...a,
            name: a.name || roleLabels[a.role] || "Admin",
          })),
        );
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
    if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email || !createForm.password) {
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
          password: createForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create admin.");

      setAdmins((prev) => [
        ...prev,
        {
          ...data.admin,
          name: data.admin.name || roleLabels[data.admin.role] || "Admin",
        },
      ]);
      setShowCreate(false);
      setCreateForm({ firstName: "", lastName: "", middleName: "", suffix: "", email: "", password: "", role: "parking" });
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

      // Using the path that matches typical admin route mounting
      const res = await fetch(`${API_BASE_URL}/api/admins/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editForm.email }),
      });

      // SAFETY CHECK: Ensure we got JSON back (prevents the "Unexpected token <" crash)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server endpoint not found (404). Check your backend routes.",
        );
      }

      const data = await res.json();
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

    // LOGIC: Only block update if they are trying to change the password
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

      // Base payload (Name/Email always updateable)
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        middleName: editForm.middleName,
        suffix: editForm.suffix,
        email: editForm.email,
      };

      // Only add Password/OTP if the user typed something in the password field
      if (editForm.password) {
        payload.password = editForm.password;
        payload.otp = editForm.otp;
      }

      const res = await fetch(`${API_BASE_URL}/api/admins/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update admin.");

      const next = admins.map((a) =>
        a.id === editTarget.id ? { ...a, ...payload, password: a.password } : a,
      );
      setAdmins(next);
      setEditTarget(null);
      setEditForm({ firstName: "", lastName: "", middleName: "", suffix: "", email: "", password: "", otp: "" });
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
      password: "",
      otp: "",
    });
    setOtpSent(false);
    setOtpTimer(0);
  };

  return (
    <Layout title="Manage Employees">
      {!isSuperAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Only Super Admin can access this.
        </div>
      ) : (
        <div className="space-y-8">
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
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && admins.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={4}>
                        Loading...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={4}>
                        No admins found.
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-all"
                      >
                        <td className="px-6 py-3 font-medium">{a.name}</td>
                        <td className="px-6 py-3">{a.email}</td>
                        <td className="px-6 py-3 capitalize">
                          {roleLabels[a.role] || a.role}
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
                      setCreateForm({ ...createForm, firstName: e.target.value })
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
                      setCreateForm({ ...createForm, middleName: e.target.value })
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
                      {Object.keys(roleLabels).map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
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
              <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
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
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">
      {label}
    </label>
    <input
      disabled={disabled}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-emerald-500 transition-colors ${disabled ? "opacity-70" : ""}`}
    />
  </div>
);
