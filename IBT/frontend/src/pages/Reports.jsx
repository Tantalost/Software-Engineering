import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import { reports } from "../data/assets";
import Form from "../components/common/Form";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditReport from "../components/reports/EditReport";
import DeleteModal from "../components/common/DeleteModal";
import ReportFilter from "../components/reports/ReportFilter";
import { Archive, Trash2 } from "lucide-react"; 

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeStatus, setActiveStatus] = useState("All");
  
  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_reports");
      return raw ? JSON.parse(raw) : reports;
    } catch (e) {
      return reports;
    }
  };
  const [records, setRecords] = useState(loadStored());
  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_reports", JSON.stringify(next));
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
        type: "Report",
        description: `Report #${rowToArchive.reportid} - ${rowToArchive.type}`,
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
    
    console.log("Item archived successfully!");
  };

  const filtered = records.filter((report) => {
    const matchesSearch =
      report.id.toString().includes(searchQuery) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      !selectedDate ||
      new Date(report.date).toDateString() ===
      new Date(selectedDate).toDateString();
    
    const matchesStatus = 
      activeStatus === "All" || 
      report.status.toLowerCase().includes(activeStatus.toLowerCase());

    return matchesSearch && matchesDate && matchesStatus;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Reports Management">
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
          <div className="h-[44px] flex items-center">
            <ExportMenu
              onExportCSV={() => console.log("Exporting to CSV...")}
              onExportExcel={() => console.log("Exporting to Excel...")}
              onExportPDF={() => console.log("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <ReportFilter 
            activeStatus={activeStatus} 
            onStatusChange={setActiveStatus} 
        />
      </div>

      <Table
        columns={["Report ID", "Type", "Author", "Date", "Status"]}
        data={paginatedData.map((report) => ({ id: report.id, reportid: report.id, type: report.type, author: report.author, date: report.date, status: report.status }))}
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
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Report</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Report ID" value={viewRow.reportid} />
              <Field label="Type" value={viewRow.type} />
              <Field label="Author" value={viewRow.author} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {editRow && (
        <EditReport
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
            <h3 className="text-base font-semibold text-slate-800">Archive Report</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to archive report {deleteRow.reportid}?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { 
                handleArchive(deleteRow); 
                setDeleteRow(null); 
              }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Archive</button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove report record? This action cannot be undone."
        itemName={deleteRow ? `${deleteRow.reportid} - ${deleteRow.type}
        - ${deleteRow.date} - ${deleteRow.author}` : ""}
      />

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl">
            <Form
              title="Reports Management"
              fields={[
                { label: "Report ID", type: "text" },
                { label: "Type", type: "text" },
                { label: "Author", type: "text" },
                { label: "Date", type: "date" },
                { label:"Status", type: "select", options: ["Draft", "Submitted", "Approved"] },
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

export default Reports;