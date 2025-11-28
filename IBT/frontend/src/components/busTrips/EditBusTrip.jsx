import React, { useState } from "react";
import Input from "../common/Input";
import DatePickerInput from "../common/DatePickerInput";
import Select from "../common/Select";

const EditBusTrip = ({ row, onClose, onSave }) => {
    const [form, setForm] = useState({
        id: row.id,
        templateNo: row.templateno,
        route: row.route,
        time: row.time,
        date: row.date,
        company: row.company,
        status: row.status,
    });

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
                <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Bus Trip</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input label="Template No" value={form.templateNo} onChange={(e) => set("templateNo", e.target.value)} />
                    <Input label="Route" value={form.route} onChange={(e) => set("route", e.g.target.value)} />
                    <Input label="Time" value={form.time} onChange={(e) => set("time", e.g.target.value)} />
                    <DatePickerInput label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                    <Input label="Company" value={form.company} onChange={(e) => set("company", e.g.target.value)} />
                    <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={["Paid", "Pending", "Inactive", "Active"]} />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                    <button onClick={() => onSave({
                        id: form.id,
                        templateNo: form.templateNo,
                        route: form.route,
                        time: form.time,
                        date: form.date,
                        company: form.company,
                        status: form.status,
                    })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};

export default EditBusTrip;