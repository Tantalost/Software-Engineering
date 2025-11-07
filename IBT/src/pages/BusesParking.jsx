import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/ExportMenu";
import BusParkingFilters from "../components/common/BusParkingFilters";
import PeriodFilter from "../components/common/PeriodFilter";
import { busSchedules } from "../data/assets";
import {MessageSquareText} from "lucide-react";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";

const BusesParking = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const uniqueCompanies = [...new Set(busSchedules.map((bus) => bus.company))];

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_busesParking");
      return raw ? JSON.parse(raw) : busSchedules;
    } catch (e) {
      return busSchedules;
    }
  };

  const [records, setRecords] = useState(loadStored());

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_busesParking", JSON.stringify(next));
  };

   const isInPeriod = (busDate, period) => {
    const date = new Date(busDate);
    const now = new Date();

    if (period === "This Week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); 
      const end = new Date(start);
      end.setDate(start.getDate() + 6); 
      return date >= start && date <= end;
    }

    if (period === "This Month") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (period === "This Year") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
   };

   const filtered = busSchedules.filter((bus) => {
    const matchesSearch =
      bus.templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;

    const matchesDate =
      !selectedDate ||
      new Date(bus.date).toDateString() === new Date(selectedDate).toDateString();

    const matchesPeriod = !selectedPeriod || isInPeriod(bus.date, selectedPeriod);

    return matchesSearch && matchesCompany && matchesDate && matchesPeriod;
  });

  const handleExportCSV = () => console.log("Exported Buses Parking to CSV");
  const handleExportExcel = () => console.log("Exported Buses Parking to Excel");
  const handleExportPDF = () => console.log("Exported Buses Parking to PDF");
  const handlePrint = () => window.print();

  return (
    <Layout title="Bus Parking Management">
      <div className="px-4 lg:px-8 mt-4">
        <div className="flex flex-col gap-4 w-full">
          <BusParkingFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            uniqueCompanies={uniqueCompanies}
          />

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 w-full">
            <div className="w-full sm:w-auto">
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
              />
            </div>

            <div className="flex justify-end w-full sm:w-auto gap-3">
              <button
                onClick={() => setShowPreview(true)}
                 className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto" >
                  <MessageSquareText />
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                + Add New
              </button>

              <ExportMenu
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                onPrint={handlePrint}
              />
            </div>
          </div>

        </div>
      </div>

      <div className="p-4 lg:p-8">
        <Table
          columns={[
            "Template No",
            "Route",
            "Time",
            "Date",
            "Company",
            "Status",
          ]}
          data={filtered.map((bus) => ({
            id: bus.id,
            templateno: bus.templateNo,
            route: bus.route,
            time: bus.time,
            date: bus.date,
            company: bus.company,
            status: bus.status,
          }))}
          actions={(row) => (
            <TableActions
              onView={() => setViewRow(row)}
              onEdit={() => setEditRow(row)}
              onDelete={() => setDeleteRow(row)}
            />
          )}
        />
      </div>

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              View Bus Parking
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Template No" value={viewRow.templateno} />
              <Field label="Route" value={viewRow.route} />
              <Field label="Time" value={viewRow.time} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Company" value={viewRow.company} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewRow(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <EditBusParking
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            const next = records.map((r) =>
              r.id === updated.id ? updated : r
            );
            persist(next);
            setEditRow(null);
          }}
        />
      )}

      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">
              Delete Bus Parking
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete template {deleteRow.templateno}?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteRow(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const next = records.filter((r) => r.id !== deleteRow.id);
                  persist(next);
                  setDeleteRow(null);
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl">
            <Form
              title="Buses Parking Management"
              fields={[
                { label: "Template No", type: "text" },
                { label: "Route", type: "text" },
                { label: "Time", type: "time" },
                { label: "Date", type: "date" },
                { label: "Company", type: "text" },
                {
                  label: "Status",
                  type: "select",
                  options: ["Active", "Inactive"],
                },
              ]}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
      {value || "-"}
    </div>
  </div>
);

const EditBusParking = ({ row, onClose, onSave }) => {
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
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          Edit Bus Parking
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Template No"
            value={form.templateNo}
            onChange={(e) => set("templateNo", e.target.value)}
          />
          <Input
            label="Route"
            value={form.route}
            onChange={(e) => set("route", e.target.value)}
          />
          <Input
            label="Time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={["Paid", "Pending", "Inactive", "Active"]}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                id: form.id,
                templateNo: form.templateNo,
                route: form.route,
                time: form.time,
                date: form.date,
                company: form.company,
                status: form.status,
              })
            }
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">
      {label}
    </label>
    <input
      value={value}
      onChange={onChange}
      type={type}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options = [] }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default BusesParking;
