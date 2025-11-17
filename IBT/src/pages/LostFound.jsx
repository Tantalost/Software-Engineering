import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import TableActions from "../components/common/TableActions";
import { lostFoundItems } from "../data/assets";
import ViewModal from "../components/lostfoundd/ViewModal";
import EditModal from "../components/lostfoundd/EditModal";
import NotifyModal from "../components/common/NotifyModal";
import AddModal from "../components/lostfoundd/AddModal";

const LostFound = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const role = localStorage.getItem("authRole") || "superadmin";

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_lostFound");
      return raw ? JSON.parse(raw) : lostFoundItems;
    } catch {
      return lostFoundItems;
    }
  };

  const [records, setRecords] = useState(loadStored());
  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_lostFound", JSON.stringify(next));
  };

  const filtered = records.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate =
      !selectedDate ||
      new Date(item.dateTime).toDateString() === new Date(selectedDate).toDateString();
    return matchesSearch && matchesDate;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleDelete = () => {
    const next = records.filter((r) => r.id !== deleteRow.id);
    persist(next);
    setDeleteRow(null);
  };

  const [fields, setFields] = useState([
    { label: "Tracking No", type: "text", placeholder: "Enter tracking no" },
    { label: "Description", type: "textarea", placeholder: "Enter detailed description" },
    { label: "Date Found", type: "date", placeholder: "" },
    { label: "Status", type: "select", placeholder: "Select status", options: ["Unclaimed", "Claimed"] }
  ]);

  const handleEditField = (field) => {
    console.log("Field clicked for edit →", field);
  };

  return (
    <Layout title="Lost and Found Records">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-2.5 font-semibold rounded-xl shadow"
          >
            + Add New
          </button>

          {role === "superadmin" && (
            <button
              onClick={() => setShowNotify(true)}
              className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:border-slate-300 transition-all"
            >
              Notify
            </button>
          )}

          <ExportMenu
            onExportCSV={() => alert("Exporting CSV...")}
            onExportExcel={() => alert("Exporting Excel...")}
            onExportPDF={() => alert("Exporting PDF...")}
            onPrint={() => window.print()}
          />
        </div>
      </div>

      <Table
        columns={["Tracking No", "Description", "DateTime", "Status"]}
        data={paginatedData.map((item) => ({
          id: item.id,
          trackingno: item.trackingNo,
          description: item.description,
          datetime: item.dateTime,
          status: item.status,
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
        itemsPerPage={itemsPerPage}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(v) => {
          setItemsPerPage(v);
          setCurrentPage(1);
        }}
      />

      {viewRow && <ViewModal row={viewRow} onClose={() => setViewRow(null)} />}
      {editRow && (
        <EditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            const next = records.map((r) => (r.id === updated.id ? updated : r));
            persist(next);
            setEditRow(null);
          }}
        />
      )}

      {showNotify && <NotifyModal onClose={() => setShowNotify(false)} />}

      {showAdd && (
        <AddModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          title="Lost & Found Form"
          fields={fields}
          onEdit={handleEditField}
        />
      )}

      {deleteRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">
            <h3 className="font-semibold text-base text-slate-800">Delete Record</h3>
            <p className="text-sm mt-1 text-slate-600">
              Delete tracking {deleteRow.trackingno}?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteRow(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-2 rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LostFound;