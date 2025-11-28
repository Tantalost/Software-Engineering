import React, { useEffect, useState } from "react";
import { Logs, X, MailOpen, Trash2 } from "lucide-react";
import Layout from "../components/layout/Layout";

export default function Notifications() {
    const [notes, setNotes] = useState(() => {
        try {
            const raw = localStorage.getItem("ibt_notifications");
            const parsed = raw ? JSON.parse(raw) : [
                { id: 1, title: "Parking gate maintenance", message: "Gate B maintenance at 3PM.", date: new Date().toISOString().slice(0, 10), read: false },
            ];
            return parsed.map(n => ({ ...n, read: n.read || false }));
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("ibt_notifications", JSON.stringify(notes));
    }, [notes]);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setSelectedIds([]); 
        }
        setIsSelectionMode(!isSelectionMode);
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === notes.length && notes.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notes.map((n) => n.id));
        }
    };

    const handleDeleteSelected = () => {
        if (confirm(`Delete ${selectedIds.length} selected notification(s)?`)) {
            const remainingNotes = notes.filter((n) => !selectedIds.includes(n.id));
            setNotes(remainingNotes);
            setSelectedIds([]);
            if (remainingNotes.length === 0) setIsSelectionMode(false);
        }
    };

    const handleMarkSelectedRead = () => {
        setNotes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
        setSelectedIds([]); 
        setIsSelectionMode(false);
    };

    const handleItemClick = (id) => {
        if (isSelectionMode) {
            toggleSelect(id);
        } else {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const isAllSelected = notes.length > 0 && selectedIds.length === notes.length;

    return (
        <Layout title="Notifications">
            
            <div className="mb-2 flex items-center justify-between px-1 h-8">
                
                <div>
                    {isSelectionMode && (
                        <div className="flex items-center gap-3 animate-in fade-in duration-200">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                disabled={notes.length === 0}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-600">
                                {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select All"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                  
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                            <button
                                onClick={handleMarkSelectedRead}
                                title="Mark as Read"
                                className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all"
                            >
                               
                                <MailOpen className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                title="Delete Selected"
                                className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all"
                            >
                               
                                <Trash2 className="h-5 w-5" />
                            </button>
                           
                            <div className="h-4 w-px bg-slate-300 mx-1"></div>
                        </div>
                    )}

                    <button
                        onClick={toggleSelectionMode}
                        disabled={notes.length === 0}
                        title={isSelectionMode ? "Cancel Selection" : "Select Notifications"}
                        className={`rounded-full p-1.5 transition-all disabled:opacity-50 
                            ${isSelectionMode 
                                ? "bg-slate-100 text-slate-600" 
                                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600" 
                            }`}
                    >
                        {isSelectionMode ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Logs className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

           
            <div className="space-y-3">
                {notes.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                        No notifications found.
                    </div>
                )}
                {notes.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => handleItemClick(n.id)}
                        className={`group relative cursor-pointer rounded-xl border p-5 shadow-sm transition-all duration-200
                            ${selectedIds.includes(n.id) 
                                ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50" 
                                : "border-slate-200 hover:shadow-md bg-white"}
                            ${!selectedIds.includes(n.id) && n.read ? "bg-slate-50" : ""}
                        `}
                    >
                        <div className="flex items-start gap-4">
                            
                            {isSelectionMode && (
                                <div className="pt-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(n.id)}
                                        onChange={() => toggleSelect(n.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </div>
                            )}
                            
                            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        
                                        {!n.read && !isSelectionMode && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                                        
                                        <div className={`text-sm ${n.read ? "font-medium text-slate-600" : "font-bold text-slate-800"}`}>
                                            {n.title}
                                        </div>
                                    </div>
                                    <div className={`text-sm mt-1 ${n.read ? "text-slate-400" : "text-slate-600"}`}>
                                        {n.message}
                                    </div>
                                </div>
                                <div className="whitespace-nowrap text-xs text-slate-400">{n.date}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
}