import React from "react";

function FieldPreview({ field, onEdit }) {
    const { label, placeholder, type = "text", options = [] } = field || {};

    const commonInputClasses =
        "w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:ring-0 disabled:opacity-100 disabled:cursor-not-allowed";

    const containerClasses =
        "group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md" +
        (onEdit ? " cursor-pointer" : "");

    const handleEdit = () => {
        if (onEdit) onEdit(field);
    };

    return (
        <div className={containerClasses} onClick={handleEdit} role={onEdit ? "button" : undefined}>
            <label className="mb-2 block text-sm font-medium text-slate-700">
                {label || "Untitled Field"}
            </label>

            {type === "select" ? (
                <select className={commonInputClasses} disabled>
                    <option value="" disabled defaultValue="">
                        {placeholder || "Select an option"}
                    </option>
                    {Array.isArray(options) &&
                        options.map((opt, idx) => (
                            <option key={idx} value={String(opt)}>
                                {String(opt)}
                            </option>
                        ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    className={commonInputClasses}
                    placeholder={placeholder || "Lorem ipsum dolor sit amet"}
                    rows={4}
                    disabled
                />
            ) : (
                <input
                    type={type || "text"}
                    className={commonInputClasses}
                    placeholder={placeholder || `Enter ${label || "value"}`}
                    disabled
                />
            )}

            {onEdit && (
                <div className="pointer-events-none absolute right-3 top-3 hidden items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 group-hover:flex">
                    Edit
                </div>
            )}
        </div>
    );
}

export default function FormPreview({ title = "Form Preview", fields = [], onEdit }) {
    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white shadow">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        Preview Only
                    </span>
                    <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                </div>
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
    );
}