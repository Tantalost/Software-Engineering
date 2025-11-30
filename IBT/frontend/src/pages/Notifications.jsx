import React, { useEffect, useState } from "react";
import { Logs, X, MailOpen, Trash2, Loader2 } from "lucide-react";
import Layout from "../components/layout/Layout";
// Import the service functions
import { fetchNotifications, markNotificationAsRead, deleteNotification } from "../utils/notificationService.js";

export default function Notifications() {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // 1. Load from MongoDB on mount
    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchNotifications();
        setNotes(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleSelectionMode = () => {
        if (isSelectionMode) setSelectedIds([]);
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

    // 2. Updated Delete Logic (API call)
    const handleDeleteSelected = async () => {
        if (confirm(`Delete ${selectedIds.length} selected notification(s)?`)) {
            // Optimistic UI update
            const remainingNotes = notes.filter((n) => !selectedIds.includes(n.id));
            setNotes(remainingNotes);
            
            // Backend calls
            await Promise.all(selectedIds.map(id => deleteNotification(id)));
            
            setSelectedIds([]);
            if (remainingNotes.length === 0) setIsSelectionMode(false);
        }
    };

    // 3. Updated Mark Read Logic (API call)
    const handleMarkSelectedRead = async () => {
        // Optimistic UI update
        setNotes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
        
        // Backend calls
        await Promise.all(selectedIds.map(id => markNotificationAsRead(id)));
        
        setSelectedIds([]); 
        setIsSelectionMode(false);
    };

    // 4. Updated Single Item Click (API call)
    const handleItemClick = async (id) => {
        if (isSelectionMode) {
            toggleSelect(id);
        } else {
            const note = notes.find(n => n.id === id);
            if (!note.read) {
                // Optimistic update
                setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                // Backend update
                await markNotificationAsRead(id);
            }
        }
    };

    const isAllSelected = notes.length > 0 && selectedIds.length === notes.length;

    return (
        <Layout title="Notifications">
            <div className="mb-2 flex items-center justify-between px-1 h-8">
                {/* Header Controls (Select All, Delete, etc) - SAME AS BEFORE */}
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
                            <button onClick={handleMarkSelectedRead} title="Mark as Read" className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all">
                                <MailOpen className="h-5 w-5" />
                            </button>
                            <button onClick={handleDeleteSelected} title="Delete Selected" className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all">
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <div className="h-4 w-px bg-slate-300 mx-1"></div>
                        </div>
                    )}
                    <button
                        onClick={toggleSelectionMode}
                        disabled={notes.length === 0}
                        title={isSelectionMode ? "Cancel Selection" : "Select Notifications"}
                        className={`rounded-full p-1.5 transition-all disabled:opacity-50 ${isSelectionMode ? "bg-slate-100 text-slate-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                    >
                        {isSelectionMode ? <X className="h-5 w-5" /> : <Logs className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-10 text-slate-400">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                        No notifications found.
                    </div>
                ) : (
                    notes.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n.id)}
                            className={`group relative cursor-pointer rounded-xl border p-5 shadow-sm transition-all duration-200
                                ${selectedIds.includes(n.id) ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:shadow-md bg-white"}
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
                    ))
                )}
            </div>
        </Layout>
    );
}