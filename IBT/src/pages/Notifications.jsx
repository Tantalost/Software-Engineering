import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";

export default function Notifications() {
    const [notes, setNotes] = useState(() => {
        try {
            const raw = localStorage.getItem("ibt_notifications");
            return raw ? JSON.parse(raw) : [
                { id: 1, title: "Parking gate maintenance", message: "Gate B maintenance at 3PM.", date: new Date().toISOString().slice(0, 10) },
            ];
        } catch {
            return [];
        }
    });
    useEffect(() => {
        localStorage.setItem("ibt_notifications", JSON.stringify(notes));
    }, [notes]);

    const [showNew, setShowNew] = useState(false);
    const [draft, setDraft] = useState({ title: "", message: "" });

    return (
        <Layout title="Notifications">
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all">+ New Notification</button>
            </div>

            <div className="space-y-3">
                {notes.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">No notifications.</div>
                )}
                {notes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                                <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                            </div>
                            <div className="text-xs text-slate-500">{n.date}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showNew && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
                        <h3 className="mb-4 text-base font-semibold text-slate-800">New Notification</h3>
                        <div className="space-y-3">
                            <FieldInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                            <FieldTextarea label="Message" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowNew(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                            <button onClick={() => { if (!draft.title) return; const next = [...notes, { id: Date.now(), title: draft.title, message: draft.message, date: new Date().toISOString().slice(0, 10) }]; setNotes(next); setShowNew(false); setDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

const FieldInput = ({ label, value, onChange }) => (
    <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
        <input value={value} onChange={onChange} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none" />
    </div>
);

const FieldTextarea = ({ label, value, onChange }) => (
    <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
        <textarea value={value} onChange={onChange} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none" />
    </div>
);