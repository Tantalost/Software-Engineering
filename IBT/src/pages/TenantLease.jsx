import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import { tenants } from "../data/assets";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";
import DatePickerInput from "../components/common/DatePickerInput";
import Pagination from "../components/common/Pagination";
import { MessageSquare } from "lucide-react";


const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [remarksRow, setRemarksRow] = useState(null);
  const [remarksText, setRemarksText] = useState("");
  const role = localStorage.getItem("authRole") || "superadmin";

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_TenantLease");
      return raw ? JSON.parse(raw) : tenants;
    } catch (e) {
      return tenants;
    }
  };

  const [records, setRecords] = useState(loadStored());
  const availableSlots = records.filter(t => t.status === "Available").length; 
  const nonAvailableSlots = records.filter(t => t.status !== "Available").length; 
  const totalSlots = records.length;


  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_TenantLease", JSON.stringify(next));
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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Tenants/Lease Management">
      <div className="mb-6">
        <StatCardGroup
          availableSlots={availableSlots}
          nonAvailableSlots={nonAvailableSlots}
          totalSlots={totalSlots}
        />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
         

          <button onClick={() => setShowPreview(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center w-full sm:w-auto">
            + Add New
          </button>
          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center w-full sm:w-auto">
              Notify
            </button>
          )}

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

       <div className="inline-flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200 mb-4">
          <button
            onClick={() => setActiveTab("permanent")}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform active:scale-95 ${activeTab === "permanent"
            ? "bg-white text-emerald-700 shadow-md"
            : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
            }`}
            >
            Permanent
          </button>
          <button
            onClick={() => setActiveTab("night")}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform active:scale-95 ${activeTab === "night"
            ? "bg-white text-emerald-700 shadow-md"
            : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
            }`}
            >
            Night Market
          </button>
        </div>

      <Table
        columns={["Slot No", "Reference No", "Name", "Email", "Contact", "Date", "Status",]}
        data={paginatedData.map((t) => ({
          id: t.id,
          slotno: t.slotNo,
          referenceno: t.referenceNo,
          name: t.name,
          email: t.email,
          contact: t.contact,
          date: t.date,
          status: t.status,
        }))}
        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <TableActions
              onView={() => setViewRow(row)}
              onEdit={() => setEditRow(row)}
              onDelete={() => setDeleteRow(row)}
            />
            {role === "superadmin" && (
              <button
                onClick={() => {
                  const storedRemarks = localStorage.getItem("ibt_tenantRemarks");
                  const remarks = storedRemarks ? JSON.parse(storedRemarks) : {};
                  setRemarksText(remarks[row.id] || "");
                  setRemarksRow(row);
                }}
                title="Remarks"
                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
              >
                <MessageSquare size={16} />
              </button>
            )}
          </div>
        )}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filtered.length}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Tenant Lease</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Slot No" value={viewRow.slotno} />
              <Field label="Reference No" value={viewRow.referenceno} />
              <Field label="Name" value={viewRow.name} />
              <Field label="Email" value={viewRow.email} />
              <Field label="Contact" value={viewRow.contact} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )
      }

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
      )
      }

      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">Delete Terminal Fee</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete template {deleteRow.ticketno}?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { const next = records.filter((r) => r.id !== deleteRow.id); persist(next); setDeleteRow(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )
      }

      {role === "superadmin" && showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Send Notification</h3>
            <div className="space-y-3">
              <Input label="Title" value={notifyDraft.title} onChange={(e) => setNotifyDraft({ ...notifyDraft, title: e.target.value })} />
              <Textarea label="Body" value={notifyDraft.message} onChange={(e) => setNotifyDraft({ ...notifyDraft, message: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowNotify(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { const raw = localStorage.getItem("ibt_notifications"); const list = raw ? JSON.parse(raw) : []; list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Tenants/Lease" }); localStorage.setItem("ibt_notifications", JSON.stringify(list)); setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
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
                { label: "Slot No", type: "text" },
                { label: "Reference No", type: "text" },
                { label: "Name", type: "text" },
                { label: "Email", type: "email" },
                { label: "Contact", type: "text" },
                { label: "Date", type: "date" },
                { label: "Status", type: "select", options: ["Active", "Inactive"] },
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

      {remarksRow && role === "superadmin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Add Remarks</h3>
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Tenant: {remarksRow.name} ({remarksRow.referenceno})</div>
            </div>
            <div className="space-y-3">
              <Textarea
                label="Remarks"
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRemarksRow(null);
                  setRemarksText("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const storedRemarks = localStorage.getItem("ibt_tenantRemarks");
                  const remarks = storedRemarks ? JSON.parse(storedRemarks) : {};
                  remarks[remarksRow.id] = remarksText;
                  localStorage.setItem("ibt_tenantRemarks", JSON.stringify(remarks));
                  setRemarksRow(null);
                  setRemarksText("");
                  alert("Remarks saved successfully!");
                }}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white shadow hover:bg-amber-700"
              >
                Save Remarks
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{value || "-"}</div>
  </div>
);

const EditTerminalFees = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id,
    slotno: row.slotNo,
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
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Tenant Lease</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Slot No" value={form.slotno} onChange={(e) => set("Slot No", e.target.value)} />
          <Input label="Reference No" value={form.referenceno} onChange={(e) => set("Reference No", e.target.value)} />
          <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          <DatePickerInput label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Input label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({
            id: form.id,
            slotno: form.slotNo,
            referenceno: form.referenceNo,
            name: form.name,
            email: form.email,
            contact: form.contact,
            date: form.date,
            status: form.status,
          })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
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

const Textarea = ({ label, value, onChange }) => (
  <div className="md:col-span-2">
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <textarea value={value} onChange={onChange} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none" />
  </div>
);



export default TenantLease;
