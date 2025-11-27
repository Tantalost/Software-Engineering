import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";

const STORAGE_KEY = "ibt_admins";

const ensureDefaultAdmins = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const defaults = [
                { id: 1, email: "admin@example.com", password: "admin123", role: "superadmin" },
                { id: 2, email: "parkingadmin@example.com", password: "parking123", role: "parking" },
                { id: 3, email: "lostfoundadmin@example.com", password: "lostfound123", role: "lostfound" },
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

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(admins));
    }, [admins]);

    const isSuperAdmin = useMemo(() => (localStorage.getItem("authRole") || "superadmin") === "superadmin", []);

    const addAdmin = () => {
        if (!createForm.email || !createForm.password) return;
        const exists = admins.some((a) => a.email.toLowerCase() === createForm.email.toLowerCase());
        if (exists) return alert("Email already exists.");
        const next = [
            ...admins,
            { id: Date.now(), email: createForm.email, password: createForm.password, role: createForm.role },
        ];
        setAdmins(next);
        setShowCreate(false);
        setCreateForm({ email: "", password: "", role: "parking" });
    };

   const removeAdmin = (id) => {
        if (window.confirm("Are you sure you want to remove this admin?")) {
            const next = admins.filter((a) => a.id !== id);
            setAdmins(next);
        }
    };

    const applyPasswordChange = () => {
        if (!editTarget || !editPassword) return;
        const next = admins.map((a) => (a.id === editTarget.id ? { ...a, password: editPassword } : a));
        setAdmins(next);
        setEditTarget(null);
        setEditPassword("");
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
                            <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all">Create Admin</button>
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
                                                            <button onClick={() => { setEditTarget(a); setEditPassword(""); }} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-green-50 transition-all">Change Password</button>
                                                            <button onClick={() => removeAdmin(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all">Remove</button>
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
                                            <option value="parking">Parking Admin</option>
                                            <option value="lostfound">Lost & Found Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                                    <button onClick={addAdmin} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Create</button>
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
                                    <button onClick={() => setEditTarget(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                                    <button onClick={applyPasswordChange} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
                                </div>
                            </div>
                        </div>
                    )}
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