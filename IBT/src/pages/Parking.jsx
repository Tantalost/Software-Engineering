import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import StatCardGroupPark from "../components/parking/StatCardGroupPark";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { parkingTickets } from "../data/assets";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditParking from "../components/parking/EditParking";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";

const Parking = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const role = localStorage.getItem("authRole") || "superadmin";
  const [showNotify, setShowNotify] = useState(false);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_parking");
      return raw ? JSON.parse(raw) : parkingTickets;
    } catch (e) {
      return parkingTickets;
    }
  };
  const [records, setRecords] = useState(loadStored());
  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_parking", JSON.stringify(next));
  };

  const filtered = records.filter((ticket) => {
    const matchesSearch = ticket.type
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesDate =
      !selectedDate ||
      new Date(ticket.date).toDateString() ===
        new Date(selectedDate).toDateString();

    return matchesSearch && matchesDate;
  });

  const carCount = filtered.filter((t) =>
    t.type.toLowerCase().includes("car")
  ).length;
  const motorcycleCount = filtered.filter((t) =>
    t.type.toLowerCase().includes("motorcycle")
  ).length;
  const totalVehicles = filtered.length;
  const totalRevenue = filtered.reduce((sum, t) => sum + (t.price || 0), 0);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Bus Parking Management">
      <div className="mb-6">
        <StatCardGroupPark
          cars={carCount}
          motorcycles={motorcycleCount}
          totalVehicles={totalVehicles}
          totalRevenue={totalRevenue}
        />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setShowPreview(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
            + Add New
          </button>
          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-sm hover:border-slate-300 transition-all flex items-center justify-center">
              Notify
            </button>
          )}
          {role === "parking" && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              Submit Report
            </button>
          )}
          <div className="h-[44px] flex items-center">
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
        columns={["Type", "Price", "Time-in", "Time-out", "Duration", "Date", "Status"]}
        data={paginatedData.map((ticket) => ({
          id: ticket.id,
          type: ticket.type,
          price: `₱${ticket.price.toFixed(2)}`,
          timein: ticket.timeIn,
          timeout: ticket.timeOut,
          duration: ticket.duration,
          date: ticket.date,
          status: ticket.status,
        }))}
        actions={(row) => (
          <TableActions
            onView={() => setViewRow(row)}
            onEdit={() => setEditRow(row)}
            onDelete={() => setDeleteRow(row)}
          />
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
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Parking Ticket</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Type" value={viewRow.type} />
              <Field label="Price" value={viewRow.price} />
              <Field label="Time-in" value={viewRow.timeIn} />
              <Field label="Time-out" value={viewRow.timeOut} />
              <Field label="Duration" value={viewRow.duration} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button></div>
          </div>
        </div>
      )}
      {editRow && (
        <EditParking
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            const next = records.map((r) => (r.id === updated.id ? updated : r));
            persist(next);
            setEditRow(null);
          }}
        />
      )}
      
      {role === "parking" && showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">Submit Parking Report</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to submit the current parking report?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { setShowSubmitModal(false); alert('Parking report submitted.'); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Submit</button>
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
              <button onClick={() => { const raw = localStorage.getItem("ibt_notifications"); const list = raw ? JSON.parse(raw) : []; list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Parking" }); localStorage.setItem("ibt_notifications", JSON.stringify(list)); setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
            </div>
          </div>
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl">
            <Form
              title="Parking Management"
              fields={[
                { label: "Type", type: "text" },
                { label: "Price", type: "number", placeholder: "0.00" },
                { label: "Time-in", type: "text" },
                { label: "Time-out", type: "text" },
                { label: "Duration", type: "text", placeholder: "e.g., 2 hours" },
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
    </Layout>
  );
};

export default Parking;
