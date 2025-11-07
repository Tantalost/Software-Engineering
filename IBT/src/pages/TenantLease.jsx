import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import StatCardGroup from "../components/tenants/StatCardGroup";
import TableActions from "../components/common/TableActions";
import Form from "../components/common/Form";
import { tenants } from "../data/assets";
import {MessageSquareText} from "lucide-react";

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
      const raw = localStorage.getItem("ibt_tenantLease");
      return raw ? JSON.parse(raw) : tenants;
    } catch (e) {
      return tenants;
    }
  };

  const [records, setRecords] = useState(loadStored());

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_tenantLease", JSON.stringify(next));
  };

  const filtered = records.filter((t) => {
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
  const availableSlots = filtered.filter(
    (t) => t.status.toLowerCase() === "available"
  ).length;
  const nonAvailableSlots = totalSlots - availableSlots;

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
          <div className="flex flex-col sm:flex-row bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("permanent")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === "permanent"
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              Permanent
            </button>
            <button
              onClick={() => setActiveTab("night")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === "night"
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              Night Market
            </button>
          </div>
    
          <button onClick={() => setShowPreview(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
           <MessageSquareText></MessageSquareText>
          </button>      
          <button
            onClick={() => setShowPreview(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center w-full sm:w-auto"
          >
            + Add New
          </button>
          <div className="flex items-center justify-end w-full sm:w-auto">
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
        columns={[
          "Slot No",
          "Reference No",
          "Name",
          "Email",
          "Contact",
          "Date",
          "Status",
        ]}
        data={filtered.map((t) => ({
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
          <TableActions
            onView={() => setViewRow(row)}
            onEdit={() => setEditRow(row)}
            onDelete={() => setDeleteRow(row)}
          />
        )}
      />

      {viewRow && (
        <Modal onClose={() => setViewRow(null)} title="View Tenant/Lease">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
            <Field label="Slot No" value={viewRow.slotno} />
            <Field label="Reference No" value={viewRow.referenceNo} />
            <Field label="Name" value={viewRow.name} />
            <Field label="Email" value={viewRow.email} />
            <Field label="Contact" value={viewRow.contact} />
            <Field label="Date" value={viewRow.date} />
            <Field label="Status" value={viewRow.status} />
          </div>
        </Modal>
      )}

      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Add Tenant/Lease">
          <Form
            title="Tenants/Lease Management"
            fields={[
              { label: "Slot No", type: "text" },
              { label: "Reference No", type: "text" },
              { label: "Name", type: "text" },
              { label: "Email", type: "email" },
              { label: "Contact", type: "number" },
              { label: "DateTime", type: "datetime-local" },
              {
                label: "Status",
                type: "select",
                options: ["Pending", "Paid", "Overdue"],
              },
            ]}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default TenantLease;

const Modal = ({ title, children, onClose, hideDefaultClose = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      {children}
      {!hideDefaultClose && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
      {value || "-"}
    </div>
  </div>
);
