import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import { tenants } from "../data/assets";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import { MessageSquare, Archive, Trash2 } from "lucide-react"; 
import Field from "../components/common/Field";
import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import TenantStatusFilter from "../components/tenants/TenantStatusFilter"; 

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent"); 
  const [activeStatus, setActiveStatus] = useState("All"); 
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [showNotify, setShowNotify] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
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

  const handleDeleteConfirm = () => {
    if (!deleteRow) return;
    const nextList = records.filter((r) => r.id !== deleteRow.id);
    persist(nextList); 
    setDeleteRow(null); 
    console.log("Item deleted successfully");
  };

  const handleArchive = (rowToArchive) => {
    if (!rowToArchive) return;

    try {
      const rawArchive = localStorage.getItem("ibt_archive");
      const archiveList = rawArchive ? JSON.parse(rawArchive) : [];

      const archiveItem = {
        id: `archive-${Date.now()}-${rowToArchive.id}`,
        type: "Tenant", 
        description: `Slot #${rowToArchive.slotno} - ${rowToArchive.name}`, 
        dateArchived: new Date().toISOString(),
        originalStatus: rowToArchive.status,
        originalData: rowToArchive
      };
      
      archiveList.push(archiveItem);
      localStorage.setItem("ibt_archive", JSON.stringify(archiveList));

    } catch (e) {
      console.error("Failed to add to archive:", e);
      return;
    }

    const nextActiveList = records.filter((r) => r.id !== rowToArchive.id);
    persist(nextActiveList);
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
    
    const matchesStatus = 
      activeStatus === "All" || 
      t.status.toLowerCase() === activeStatus.toLowerCase();

    return matchesSearch && matchesTab && matchesDate && matchesStatus;
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

          {role === "lease" && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              Submit Report
            </button>
          )}

          <div className="flex items-center justify-end w-full sm:w-auto transition-transform duration-300 active:scale-95 hover:scale-105">
            <ExportMenu
              onExportCSV={() => console.log("Exporting to CSV...")}
              onExportExcel={() => console.log("Exporting to Excel...")}
              onExportPDF={() => console.log("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="inline-flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200">
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

        <TenantStatusFilter 
          activeStatus={activeStatus} 
          onStatusChange={setActiveStatus} 
        />
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
            <button
              onClick={() => handleArchive(row)}
              title="Archive"
              className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
            >
              <Archive size={16} />
            </button>
            <button
              onClick={() => setDeleteRow(row)}
              title="Delete"
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
              <Trash2 size={16} />
            </button>

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
        <EditTenantLease
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
            <h3 className="text-base font-semibold text-slate-800">Archive Tenant</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to archive tenant {deleteRow.name} (Slot {deleteRow.slotno})?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { 
                handleArchive(deleteRow); 
                setDeleteRow(null); 
              }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Archive</button>
            </div>
          </div>
        </div>
      )
      }

      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this tenant/lease record? This action cannot be undone."
        itemName={deleteRow ? `Slot #${deleteRow.slotno} - ${deleteRow.referenceno}
        - ${deleteRow.name}` : ""}
      />

      {role === "lease" && showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">Submit Lease Report</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to submit the current lease report?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { setShowSubmitModal(false); console.log('Parking report submitted.'); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Submit</button>
            </div>
          </div>
        </div>
      )}

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
                { label: "Status", type: "select", options: ["Active", "Inactive", "Paid", "Overdue", "Pending"] },
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
                  console.log("Remarks saved successfully!"); 
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

export default TenantLease;