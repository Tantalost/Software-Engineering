import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import StatCards from "../components/common/StatCards";
import { tickets } from "../data/assets";
import { User, GraduationCap, HeartPulse, Users } from "lucide-react";

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
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

  const filtered = tickets.filter((fee) => {
    const matchesSearch = fee.passengerType
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate
      ? new Date(fee.date).toDateString() === new Date(selectedDate).toDateString()
      : true;
    return matchesSearch && matchesDate;
  });

  const regularCount = filtered.filter(
    (f) => f.passengerType.toLowerCase() === "regular"
  ).length;

  const studentCount = filtered.filter(
    (f) => f.passengerType.toLowerCase() === "student"
  ).length;

  const seniorCount = filtered.filter(
    (f) =>
      f.passengerType.toLowerCase() === "senior citizen" ||
      f.passengerType.toLowerCase() === "pwd"
  ).length;

  const totalPassengers = filtered.length;

  const stats = [
    {
      label: "Regular Passengers",
      value: regularCount,
      icon: <User className="text-emerald-600 w-6 h-6" />,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconBg: "bg-emerald-100",
      textColor: "text-emerald-700",
      valueColor: "text-emerald-800",
    },
    {
      label: "Students",
      value: studentCount,
      icon: <GraduationCap className="text-blue-600 w-6 h-6" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100",
      textColor: "text-blue-700",
      valueColor: "text-blue-800",
    },
    {
      label: "Senior Citizen / PWD",
      value: seniorCount,
      icon: <HeartPulse className="text-rose-600 w-6 h-6" />,
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      iconBg: "bg-rose-100",
      textColor: "text-rose-700",
      valueColor: "text-rose-800",
    },
    {
      label: "Total Passengers",
      value: totalPassengers,
      icon: <Users className="text-cyan-600 w-6 h-6" />,
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      iconBg: "bg-cyan-100",
      textColor: "text-cyan-700",
      valueColor: "text-cyan-800",
    },
  ];

  return (
    <Layout title="Terminal Fees Management">
      <StatCards stats={stats} />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <div className="flex items-center justify-end gap-3">
          <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
          <MessageSquareText></MessageSquareText>
        </button>
        <div className="flex justify-end sm:justify-end w-full sm:w-auto gap-5">
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
        columns={["Ticket No", "Passenger Type", "Time", "Date", "Price"]}
        data={filtered.map((fee) => ({
          id: tickets.id,
          ticketno: fee.ticketNo,
          passengertype: fee.passengerType,
          time: fee.time,
          date: fee.date,
          price: `₱${fee.price.toFixed(2)}`,
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
              <Field label="Ticket NO" value={viewRow.ticketno} />
              <Field label="Passenger Type" value={viewRow.passengertype} />
              <Field label="Time" value={viewRow.time} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Price" value={viewRow.price} />
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button></div>
          </div>
        </div>
      )}

      {editRow && (
        <EditTerminalFees
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
                { label: "Ticket NO", type: "text" },
                { label: "Passenger Type", type: "select", options: ["Regular", "Student", "Senior Citizen / PWD"] },
                { label: "Time", type: "number" },
                { label: "Date", type: "datetime-local" },
                { label: "Price", type: "number" },
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

export default TerminalFees;


const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{value || "-"}</div>
  </div>
);

const EditTerminalFees = ({ row, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    id: row.id,
    ticketno: row.ticketno,
    passengertype: row.passengerType,
    time: row.time,
    date: row.date,
    price: row.price,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Terminal Fees</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Ticket No" value={form.ticketno} onChange={(e) => set("slotno", e.target.value)} />
          <Select label="Status" value={form.passengertype} onChange={(e) => set("status", e.target.value)} options={["Student", "Senior Citizen/ PWD", "Regular"]} />
          <Input label="Time" value={form.time} onChange={(e) => set("name", e.target.value)} />
          <Input label="Date" value={form.date} onChange={(e) => set("email", e.target.value)} />
          <Input label="Price" value={form.price} onChange={(e) => set("contact", e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({ id: form.id, ticketno: form.ticketNo, passengertype: form.passengerType, time: form.time, date: form.date, price: form.price, })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
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
