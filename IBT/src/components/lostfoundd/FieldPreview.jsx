import React from "react";

export default function FieldPreview({ field, onEdit }) {
    const { label, placeholder, type = "text", options = [] } = field || {};

    const commonInputClasses =
        "w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:ring-0 disabled:opacity-100 disabled:cursor-not-allowed";

    const containerClasses =
        "group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md" +
        (onEdit ? " cursor-pointer" : "");

    return (
        <div className={containerClasses} onClick={() => onEdit?.(field)} role={onEdit ? "button" : undefined}>
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
                    rows={4}
                    disabled
                    placeholder={placeholder || "Lorem ipsum dolor sit amet"}
                />
            ) : (
                <input
                    className={commonInputClasses}
                    disabled
                    type={type}
                    placeholder={placeholder || `Enter ${label || "value"}`}
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