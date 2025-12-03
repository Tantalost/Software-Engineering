import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditReport from "../components/reports/EditReport";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal"; 
import { logActivity } from "../utils/logger"; 
import { Archive, Trash2, Calendar, Tag, History, ListChecks, X, Loader2, FileSpreadsheet, FileText } from "lucide-react";

// --- FIXED EXPORT IMPORTS ---
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf"; 
import autoTable from "jspdf-autotable"; 

// --- HELPER COMPONENT FOR VIEWING REPORT DATA ---
const DataRenderer = ({ reportPayload }) => {
  if (!reportPayload) return <div className="text-gray-400 italic p-4">No report data available</div>;

  const { statistics, data } = reportPayload;

  const renderStats = () => {
    if (!statistics || Object.keys(statistics).length === 0) return null;
    return (
      <div className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statistics).map(([key, value]) => (
            <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className="text-xl font-bold text-slate-800">
                {typeof value === "number" ? value.toLocaleString() : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataTable = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No records were found in this report.</p>
        </div>
      );
    }

    const headers = Object.keys(data[0]).filter((k) => k !== "id" && k !== "_id");

    return (
      <div>
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm max-h-[400px]">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 whitespace-nowrap font-semibold border-b border-slate-200">
                    {header.replace(/([A-Z])/g, " $1").trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  {headers.map((header) => {
                    let cellVal = row[header];
                    if (typeof cellVal === "object" && cellVal !== null) cellVal = JSON.stringify(cellVal);
                    return (
                      <td key={`${idx}-${header}`} className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {cellVal || "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-2">
      {renderStats()}
      {renderDataTable()}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const Reports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Basic search & date
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("All");
  // Removed activeStatus since we are removing status column/filtering focus
  
  const [showPreview, setShowPreview] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false); 

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = "http://localhost:3000/api/reports";
  const ARCHIVE_URL = "http://localhost:3000/api/archives";

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setRecords(data.map((item) => ({ ...item, id: item._id || item.id })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered data logic
  const filtered = useMemo(() => {
    return records.filter((report) => {
      const reportDate = new Date(report.createdAt || report.date);
      const now = new Date();

      const matchesSearch =
        report.id?.toString().includes(searchQuery) ||
        report.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = !selectedDate || reportDate.toDateString() === new Date(selectedDate).toDateString();
      const matchesCategory = selectedCategory === "All" || report.type === selectedCategory;

      let matchesTimeRange = true;
      if (timeRange !== "All") {
        if (timeRange === "This Week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesTimeRange = reportDate >= weekAgo;
        } else if (timeRange === "This Month") matchesTimeRange = reportDate.getMonth() === now.getMonth();
        else if (timeRange === "This Year") matchesTimeRange = reportDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesDate && matchesCategory && matchesTimeRange;
    });
  }, [records, searchQuery, selectedDate, selectedCategory, timeRange]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // --- MAIN EXPORT FUNCTIONS (List) ---

  const handleExportExcel = () => {
    const dataToExport = filtered.map((item) => ({
      "Report ID": item.id,
      "Type": item.type,
      "Author": item.author,
      "Date": new Date(item.createdAt || item.date).toLocaleDateString(),
      // Removed Status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    XLSX.writeFile(workbook, `Reports_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.text("Reports List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Removed Status from columns
    const tableColumn = ["Report ID", "Type", "Author", "Date"];
    
    const tableRows = filtered.map((item) => [
      item.id,
      item.type,
      item.author,
      new Date(item.createdAt || item.date).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Reports_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- SINGLE REPORT EXPORT FUNCTIONS (Details) ---

  const handleSingleExportExcel = (report) => {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet (Meta + Stats)
    const summaryData = [
      ["Report Details"],
      ["ID", report.id],
      ["Type", report.type],
      ["Author", report.author],
      ["Date", new Date(report.createdAt || report.date).toLocaleDateString()],
      [],
      ["Statistics"]
    ];

    if (report.data?.statistics) {
      Object.entries(report.data.statistics).forEach(([key, value]) => {
        summaryData.push([key, value]);
      });
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 2. Data Sheet
    if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
      const wsData = XLSX.utils.json_to_sheet(report.data.data);
      XLSX.utils.book_append_sheet(wb, wsData, "Data");
    }

    XLSX.writeFile(wb, `${report.type}_Report_${report.id}.xlsx`);
  };

  const handleSingleExportPDF = (report) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text("Report Details", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Metadata
    doc.setFontSize(11);
    doc.text(`ID: ${report.id}`, 14, 30);
    doc.text(`Type: ${report.type}`, 14, 36);
    doc.text(`Author: ${report.author}`, 14, 42);
    doc.text(`Date: ${new Date(report.createdAt || report.date).toLocaleDateString()}`, 14, 48);

    let currentY = 60;

    // Statistics
    if (report.data?.statistics) {
        doc.setFontSize(12);
        doc.text("Statistics", 14, currentY);
        currentY += 10;
        
        const statsData = Object.entries(report.data.statistics).map(([k, v]) => [k, v]);
        autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Value']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 50 },
            styles: { fontSize: 10 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // Data Table
    if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
        doc.setFontSize(12);
        doc.text("Data Records", 14, currentY);
        
        const headers = Object.keys(report.data.data[0]);
        const rows = report.data.data.map(row => Object.values(row));

        autoTable(doc, {
            startY: currentY + 5,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [16, 185, 129] }
        });
    }

    doc.save(`${report.type}_Report_${report.id}.pdf`);
  };

  // --- SELECTION HANDLERS ---
  const toggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    } else {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

  // --- BULK ACTION: ARCHIVE & DELETE (SUPERADMIN) ---
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} reports? \n\nThey will be moved to the Archives before deletion.`)) return;

    setLoading(true);
    try {
        const processPromises = selectedIds.map(async (id) => {
            const report = records.find(r => r.id === id);
            if (!report) return;

            // 1. AUTO-ARCHIVE
            await fetch(ARCHIVE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "Report",
                    description: `${report.type} Report by ${report.author}`,
                    originalData: report,
                    archivedBy: role
                })
            });

            // 2. PERMANENT DELETE
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        });

        await Promise.all(processPromises);
        await logActivity(role, "BULK_DELETE_REPORTS", `Archived & Deleted ${selectedIds.length} reports`, "Reports");
        
        await fetchReports();
        setSelectedIds([]);
        setIsSelectionMode(false);
        alert(`Successfully archived and deleted ${selectedIds.length} reports.`);

    } catch (error) {
        console.error("Bulk action failed", error);
        alert("Failed to process some records.");
    } finally {
        setLoading(false);
    }
  };

  // Single Delete
  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
      await logActivity(role, "DELETE_REPORT", `Deleted Report ${deleteRow.id}`, "Reports");
      setRecords(records.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Single Archive
  const handleArchive = async (row) => {
    if (!window.confirm("Archive this report?")) return;
    try {
        await fetch(ARCHIVE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "Report",
                description: `${row.type} Report by ${row.author}`,
                originalData: row,
                archivedBy: role
            })
        });

        await fetch(`${API_URL}/${row.id}`, { method: "DELETE" });
        await logActivity(role, "ARCHIVE_REPORT", `Archived Report ${row.id}`, "Reports");
        
        setRecords(records.filter((r) => r.id !== row.id));
        alert("Report moved to archives.");
    } catch (e) {
        console.error(e);
    }
  };

  // --- TABLE COLUMNS (Updated: Removed Status) ---
  const tableColumns = isSelectionMode 
    ? [
        <div key="header-check" className="flex items-center">
            <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
        </div>,
        "Report ID", "Type", "Author", "Date"
      ]
    : ["Report ID", "Type", "Author", "Date"];

  return (
    <Layout title="Reports Management">
      {/* Top Header Section (Search & Main Actions) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            + Add New
          </button>
          
          <div className="h-[44px] flex items-center">
            <ExportMenu 
              onExportExcel={handleExportExcel} 
              onExportPDF={handleExportPDF} 
            />
          </div>
        </div>
      </div>

      {/* Secondary Filter Grid (Filters, Logs & Selection Controls) */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1. Category Dropdown */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Tag size={16} />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 hover:border-slate-400 transition-all appearance-none cursor-pointer"
          >
            {["All", "Buses", "Tickets", "Tenant/Lease", "Parking", "Lost & Found"].map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 2. Time Range Dropdown */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Calendar size={16} />
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 hover:border-slate-400 transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Time</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 3. Action Buttons (Logs & Selection) */}
        <div className="flex items-center justify-end gap-2">
            
            {/* Logs Button */}
            <button 
                onClick={() => setShowLogModal(true)} 
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all"
                title="View Logs"
            >
                <History size={18} /> 
                <span className="hidden xl:inline">Logs</span>
            </button>

            {isSelectionMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                    {selectedIds.length} Selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    title="Delete Selected"
                    className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
            )}
           
            <button
              onClick={toggleSelectionMode}
              title={isSelectionMode ? "Cancel Selection" : "Select Records"}
              className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
              isSelectionMode
              ? "bg-red-500 text-white shadow-md"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
              >
              {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
            </button>
        </div>

      </div>

      {/* Table Section */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" />
            Loading reports...
        </div>
      ) : (
        <Table
          columns={tableColumns}
          data={paginatedData.map((report) => {
            const baseData = {
                id: report.id,
                reportid: report.id ? report.id.substring(0, 8).toUpperCase() : "ERR",
                type: report.type,
                author: report.author,
                date: new Date(report.createdAt || report.date).toLocaleDateString()
                // Removed status from data object
            };

            if (isSelectionMode) {
                return {
                    select: (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox"
                                checked={selectedIds.includes(report.id)}
                                onChange={() => toggleSelect(report.id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>
                    ),
                    ...baseData
                };
            }
            return baseData;
          })}

          actions={(row) => {
            const fullRecord = records.find(r => r.id === row.id);
            
            return (
              <div className="flex justify-end items-center space-x-2">
                <TableActions 
                  onView={() => setViewRow(fullRecord)} 
                    // Edit button removed here
                  onDelete={() => setDeleteRow(fullRecord)} 
                />
                <button
                  onClick={() => handleArchive(fullRecord)}
                  className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
                  title="Archive"
                >
                  <Archive size={16} />
                </button>
                <button
                  onClick={() => setDeleteRow(fullRecord)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filtered.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filtered.length}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
      />

      {/* LOG MODAL */}
      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
      />

      {/* View Modal (Updated with Exports) */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Report Details</h3>
                <p className="text-sm text-slate-500 mt-1">
                  ID: <span className="font-mono text-slate-700">{viewRow.id}</span>
                </p>
              </div>
              {/* Removed Status Badge here as requested */}
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <Field label="Source Module" value={viewRow.type} />
                   <Field label="Submitted By" value={viewRow.author} />
                   <Field label="Submission Date" value={new Date(viewRow.createdAt || viewRow.date).toLocaleDateString()} />
                </div>
                <hr className="border-slate-100 mb-6" />
                <DataRenderer reportPayload={viewRow.data} />
            </div>
            
            {/* Modal Footer with Export Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
              <div className="flex gap-2">
                <button
                    onClick={() => handleSingleExportExcel(viewRow)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                    <FileSpreadsheet size={16} />
                    Export Excel
                </button>
                <button
                    onClick={() => handleSingleExportPDF(viewRow)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                >
                    <FileText size={16} />
                    Export PDF
                </button>
              </div>

              <button
                onClick={() => setViewRow(null)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}


      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this report? This action cannot be undone."
        itemName={deleteRow ? `${deleteRow.type} Report` : ""}
      />
    </Layout>
  );
};

export default Reports;