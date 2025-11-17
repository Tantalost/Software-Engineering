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

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  const filtered = records.filter((report) => {
    const matchesSearch =
      report.id.toString().includes(searchQuery) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      !selectedDate ||
      new Date(report.date).toDateString() ===
      new Date(selectedDate).toDateString();

    return matchesSearch && matchesDate;
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
              onExportCSV={() => alert("Exporting to CSV...")}
              onExportExcel={() => alert("Exporting to Excel...")}
              onExportPDF={() => alert("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <Table
        columns={["Report ID", "Type", "Author", "Date", "Status"]}
        data={paginatedData.map((report) => ({ id: report.id, reportid: report.id, type: report.type, author: report.author, date: report.date, status: report.status }))}
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
                { label: "Status", type: "select", options: ["Draft", "Submitted", "Approved"] },
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