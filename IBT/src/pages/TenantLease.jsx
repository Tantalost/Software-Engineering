import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import StatCardGroup from "../components/tenants/StatCardGroup";
import { tenants } from "../data/assets";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_lostFound");
      return raw ? JSON.parse(raw) : lostFoundItems;
    } catch (e) {
      return lostFoundItems;
    }
  };
  const [records, setRecords] = useState(loadStored());

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_lostFound", JSON.stringify(next));
  };

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "permanent" ? t.type === "permanent" : t.type === "night";

    const matchesDate =
      !selectedDate ||
      new Date(t.date).toDateString() === new Date(selectedDate).toDateString();

    return matchesSearch && matchesTab && matchesDate;
  });

  const totalSlots = filtered.length;
  const availableSlots = filtered.filter((t) => t.status === "available").length;
  const nonAvailableSlots = filtered.filter((t) => t.status !== "available").length;

  return (
    <Layout title="Tenants/Lease Management">
      <StatCardGroup
        availableSlots={availableSlots}
        nonAvailableSlots={nonAvailableSlots}
        totalSlots={totalSlots}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("permanent")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${activeTab === "permanent"
                ? "bg-white text-emerald-700 shadow-md"
                : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
                }`}
            >
              Permanent
            </button>
            <button
              onClick={() => setActiveTab("night")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${activeTab === "night"
                ? "bg-white text-emerald-700 shadow-md"
                : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
                }`}
            >
              Night Market
            </button>
          </div>

          <button onClick={() => setShowPreview(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center w-full sm:w-auto">
            + Add New
          </button>

          <div className="flex items-center justify-end w-full sm:w-auto transition-transform duration-300 active:scale-95 hover:scale-105">
            <ExportMenu
              onExportCSV={() => alert("Exporting to CSV...")}
              onExportExcel={() => alert("Exporting to Excel...")}
              onExportPDF={() => alert("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <Table
        columns={["Slot No", "Reference No", "Name", "Email", "Contact", "Date", "Status",]}
        data={filtered.map((t) => ({
          id: t.id, slotno: t.slotNo, referenceno: t.referenceNo, name: t.name, email: t.email, contact: t.contact, date: t.date, status: t.status,
        }))}
        actions={(row) => (
          <TableActions
            onView={() => setViewRow(row)}
            onEdit={() => setEditRow(row)}
            onDelete={() => setDeleteRow(row)}
          />
        )}
      />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Tenant/Lease</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Slot NO" value={viewRow.slotno} />
              <Field label="Reference NO" value={viewRow.referenceno} />
              <Field label="Name" value={viewRow.name} />
              <Field label="Email" value={viewRow.email} />
              <Field label="Contact" value={viewRow.contact} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button></div>
          </div>
        </div>
      )}

      {editRow && (
        <EditTenantLease
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            const next = records.map((r) => (r.id === updated.id ? updated : r));
            persist(next);
            setEditRow(null);
          }}
        />
      )}

      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">Delete Tenant/Lease</h3>
            <p className="mt-2 text-sm text-slate-600">Delete slot {deleteRow.slotno}?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { const next = records.filter((r) => r.id !== deleteRow.id); persist(next); setDeleteRow(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl">
            <Form
              title="Tenants/Lease Management"
              fields={[
                { label: "Slot NO", type: "text" },
                { label: "Reference NO", type: "text" },
                { label: "Name", type: "text" },
                { label: "Email", type: "email" },
                { label: "Contact", type: "number" },
                { label: "DateTime", type: "datetime-local" },
                { label: "Status", type: "select", options: ["Pending", "Paid", "Overdue"] },
              ]}
            />
            <div className="mt-3 flex justify-end">
              <button onClick={() => setShowPreview(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TenantLease;


const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{value || "-"}</div>
  </div>
);

const EditTenantLease = ({ row, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    id: row.id,
    slotno: row.slotno, 
    referenceno: row.referenceNo, 
    name: row.name, 
    email: row.email, 
    contact: row.contact, 
    date: row.date, 
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Record</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Slot No" value={form.slotno} onChange={(e) => set("slotno", e.target.value)} />
          <Input label="Reference No" value={form.referenceno} onChange={(e) => set("referenceno", e.target.value)} />
          <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          <Input label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={["Unclaimed", "Paid", "Overdue"]} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({ id: t.id, slotno: t.slotNo, referenceno: t.referenceNo, name: t.name, email: t.email, contact: t.contact, date: t.date, status: t.status, })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <input value={value} onChange={onChange} type={type} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none" />
  </div>
);

const Select = ({ label, value, onChange, options = [] }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <select value={value} onChange={onChange} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none">
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
