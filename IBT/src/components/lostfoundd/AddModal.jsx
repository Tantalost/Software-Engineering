import React from "react";
import FieldPreview from "./FieldPreview";

export default function AddModal({ isOpen, onClose, title = "Add Form", fields = [], onEdit }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] px-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl border border-slate-200">
              
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 transition"
                    >
                        ✕
                    </button>
                </div>

              
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                                Preview Only
                            </span>
                            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                        </div>

                        <div className="px-5 py-5">
                            {(!fields || fields.length === 0) && (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                    No fields to preview. Add fields in the builder to see them here.
                                </div>
                            )}

                            {fields && fields.length > 0 && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {fields.map((field, index) => (
                                        <FieldPreview key={index} field={field} onEdit={onEdit} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
                    <button
                        className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
