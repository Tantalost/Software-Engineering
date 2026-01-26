import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
// ADDED: Imports for DeleteModal and Icons
import DeleteModal from "../components/common/DeleteModal"; 
import { Trash2, CheckCircle, XCircle, X, UserX } from "lucide-react"; 

const STORAGE_KEY = "ibt_admins";

const ensureDefaultAdmins = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const defaults = [
                { id: 1, email: "admin@example.com", password: "admin123", role: "superadmin" },
                { id: 2, email: "parkingadmin@example.com", password: "parking123", role: "parking" },
                { id: 3, email: "lostfoundadmin@example.com", password: "lostfound123", role: "lostfound" },
                { id: 4, email: "ticketadmin@example.com", password: "ticket123", role: "ticket" },
                { id: 5, email: "busadmin@example.com", password: "bus123", role: "bus" },
                { id: 6, email: "leaseadmin@example.com", password: "lease123", role: "lease" },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

export default function EmployeeManage() {
    const [admins, setAdmins] = useState(() => ensureDefaultAdmins());
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ email: "", password: "", role: "parking" }); 
    const [editTarget, setEditTarget] = useState(null);
    const [editPassword, setEditPassword] = useState("");
    
    // ADDED: State for Delete Modal and Notification
    const [deleteTarget, setDeleteTarget] = useState(null); 
    const [notificationState, setNotificationState] = useState({ 
      isOpen: false, 
      type: '', 
      message: '', 
      autoClose: true,
      duration: 3000
    }); 

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(admins));
    }, [admins]);

    // ADDED: Auto-close Notification Effect
    useEffect(() => {
        if (notificationState.isOpen && notificationState.autoClose) {
            const timerDuration = notificationState.duration || 3000; 
            const timer = setTimeout(() => {
                setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 }); 
            }, timerDuration); 
            return () => clearTimeout(timer);
        }
    }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]); 

    const isSuperAdmin = useMemo(() => (localStorage.getItem("authRole") || "superadmin") === "superadmin", []);

    const addAdmin = () => {
        if (!createForm.email || !createForm.password) return;
        const exists = admins.some((a) => a.email.toLowerCase() === createForm.email.toLowerCase());
        if (exists) {
            // FIXED: Replaced alert() with custom notification
            setNotificationState({ isOpen: true, type: 'error', message: "Email already exists.", autoClose: true, duration: 3000 });
            return;
        } 
        const next = [
            ...admins,
            { id: Date.now(), email: createForm.email, password: createForm.password, role: createForm.role },
        ];
        setAdmins(next);
        setShowCreate(false);
        setCreateForm({ email: "", password: "", role: "parking" });
        // ADDED: Success notification for creation
        setNotificationState({ isOpen: true, type: 'success', message: `${createForm.email} created successfully.`, autoClose: true, duration: 3000 });
    };

    // MODIFIED: Replaced original removeAdmin with logic to trigger the modal
    // Actual deletion logic moved to handleDeleteConfirm
    // const removeAdmin = (id) => { ... } // REMOVED

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;

        try {
            const adminEmail = deleteTarget.email; 
            const next = admins.filter((a) => a.id !== deleteTarget.id);
            setAdmins(next);
            // ADDED: Success notification for deletion
            setNotificationState({ isOpen: true, type: 'success', message: `${adminEmail} has been successfully removed.`, autoClose: true, duration: 3000 });
        } catch (error) {
            console.error("Error removing admin:", error);
            setNotificationState({ isOpen: true, type: 'error', message: `Failed to remove admin: ${deleteTarget.email}.`, autoClose: true, duration: 3000 });
        } finally {
            setDeleteTarget(null);
        }
    };

    const applyPasswordChange = () => {
        if (!editTarget || !editPassword) return;
        const next = admins.map((a) => (a.id === editTarget.id ? { ...a, password: editPassword } : a));
        setAdmins(next);
        setEditTarget(null);
        setEditPassword("");
        // ADDED: Success notification for password change
        setNotificationState({ isOpen: true, type: 'success', message: `Password for ${editTarget.email} updated.`, autoClose: true, duration: 3000 });
    };

    return (
        <Layout title="Manage Employees">
            {!isSuperAdmin ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Only Super Admin can access this.</div>
            ) : (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Manage / View Admins</h2>
                            <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                                title='Create Account'>Create Admin</button>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-600">
                                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.length === 0 ? (
                                            <tr>
                                                <td className="px-6 py-4" colSpan={3}>No admins found.</td>
                                            </tr>
                                        ) : (
                                            admins.map((a) => (
                                                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                                                    <td className="px-6 py-3">{a.email}</td>
                                                    <td className="px-6 py-3 capitalize">{a.role}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => { setEditTarget(a); setEditPassword(""); }} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-green-50 transition-all cursor-pointer">Change Password</button>
                                                            {/* MODIFIED: Changed onClick to trigger the DeleteModal by setting deleteTarget */}
                                                            <button onClick={() => setDeleteTarget(a)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all cursor-pointer">Remove</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {showCreate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
                                <h3 className="mb-4 text-base font-semibold text-slate-800">Create New Admin</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <Field label="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                                    <Field label="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
                                        <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none">
                                            <option value="bus">Bus Admin</option>
                                            <option value="lease">Lease Admin</option>
                                            <option value="lostfound">Lost & Found Admin</option>
                                            <option value="parking">Parking Admin</option>
                                            <option value="ticket">Ticket Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">Cancel</button>
                                    <button onClick={addAdmin} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700 cursor-pointer">Create</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {editTarget && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
                                <h3 className="mb-4 text-base font-semibold text-slate-800">Change Password</h3>
                                <div className="space-y-3">
                                    <Field label="Admin Email" value={editTarget.email} disabled />
                                    <Field label="New Password" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => setEditTarget(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">Cancel</button>
                                    <button onClick={applyPasswordChange} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700 cursor-pointer">Save</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* ADDED: Delete Confirmation Modal */}
            <DeleteModal 
                isOpen={!!deleteTarget} 
                onClose={() => setDeleteTarget(null)} 
                onConfirm={handleDeleteConfirm} 
                title="Remove Admin Account" 
                // Using an icon prop for consistency with other modals (optional)
                icon={<UserX size={28} className="text-red-500" />} 
                message={`Are you sure you want to PERMANENTLY remove the admin account for ${deleteTarget?.email || 'this user'}? This action cannot be undone.`} 
                itemName={deleteTarget?.email || ""}
            />

            {/* ADDED: Status Pop-up Component */}
            {notificationState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pointer-events-none cursor-pointer">
                    <div 
                        className={`flex items-center gap-4 ${notificationState.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} 
                                    text-white p-4 rounded-xl shadow-xl transition-all duration-300 transform 
                                    animate-in fade-in slide-in-from-top-10 pointer-events-auto`}
                        role="alert"
                    >
                        {notificationState.type === 'success' 
                            ? <CheckCircle size={32} /> 
                            : <XCircle size={32} />
                        }
                        <div>
                            <h4 className="font-bold text-lg">{notificationState.type === 'success' ? 'Success!' : 'Error'}</h4>
                            <p className="text-sm">{notificationState.message}</p>
                        </div>
                        <button 
                            onClick={() => setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 })} 
                            className="p-1 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

        </Layout>
    );
}

const Field = ({ label, value, onChange, type = "text", disabled = false }) => (
    <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
        <input disabled={disabled} value={value} onChange={onChange} type={type} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ${disabled ? "opacity-70" : ""}`} />
    </div>
);