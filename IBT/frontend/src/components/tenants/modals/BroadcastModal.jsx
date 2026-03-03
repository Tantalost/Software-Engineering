import React from "react";
import { X, Download, FileText, Trash2 } from "lucide-react";

const BroadcastModal = ({ isOpen, onClose, onBroadcast, draft, setDraft }) => {
    if (!isOpen) return null;

    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setDraft(prev => ({ ...prev, attachment: file }));
    };

    const removeFile = () => setDraft(prev => ({ ...prev, attachment: null }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Broadcast Message</h3>
                        <p className="text-xs text-slate-500">Manage announcements and scheduling</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-50 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                        <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                            placeholder="Announcement Title"
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                        <textarea
                            value={draft.message}
                            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                            placeholder="Write your message here..."
                            rows={3}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Attachment</label>
                        {!draft.attachment ? (
                            <div className="relative group">
                                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/30 flex flex-col items-center justify-center group-hover:border-emerald-400 group-hover:bg-emerald-50/30 transition-all">
                                    <Download className="text-slate-300 group-hover:text-emerald-500 mb-2" size={20} />
                                    <p className="text-xs font-medium text-slate-600">Click or drag to upload</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">PDF or Image (Max 10MB)</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 animate-in fade-in slide-in-from-top-1">
                                <div className="w-8 h-10 bg-white rounded border border-emerald-100 flex items-center justify-center shadow-sm">
                                    <FileText className="text-emerald-500" size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{draft.attachment.name}</p>
                                    <p className="text-[10px] text-slate-400">{(draft.attachment.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <button onClick={removeFile} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post Timing</label>
                        <div className="flex gap-3">
                            <button onClick={() => setDraft({...draft, isScheduled: false, scheduleTime: ""})} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${!draft.isScheduled ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Post Now</button>
                            <button onClick={() => setDraft({...draft, isScheduled: true})} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${draft.isScheduled ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Schedule</button>
                        </div>

                        {draft.isScheduled && (
                            <div className="pt-1 animate-in fade-in slide-in-from-top-2">
                                <input type="datetime-local" min={getCurrentDateTime()} value={draft.scheduleTime} onChange={(e) => setDraft({ ...draft, scheduleTime: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/30 rounded-b-2xl">
                    <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl text-slate-600 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={onBroadcast} disabled={!draft.title || !draft.message || (draft.isScheduled && !draft.scheduleTime)} className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {draft.isScheduled ? "Schedule" : "Send Broadcast"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;