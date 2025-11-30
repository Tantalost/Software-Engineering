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
// Removed ReportFilter import to implement custom logic directly
import { Archive, Trash2, FileBarChart, Filter, Calendar, Tag, Layers } from "lucide-react";

// --- VISUALIZED DATA RENDERER (Unchanged) ---
const DataRenderer = ({ reportPayload }) => {
  if (!reportPayload) return <div className="text-gray-400 italic p-4">No report data available</div>;

  const { statistics, filters, data } = reportPayload;

  const renderStats = () => {
    if (!statistics || Object.keys(statistics).length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3">
          <FileBarChart size={14} /> Snapshot Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statistics).map(([key, value]) => (
            <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-xl font-bold text-slate-800">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    if (!filters || Object.keys(filters).length === 0) return null;
    const hasValues = Object.values(filters).some(val => val !== "" && val !== "All");
    if (!hasValues) return null;

    return (
      <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
         <h4 className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-2">
            <Filter size={14} /> Applied Filters Context
         </h4>
         <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              (value && value !== "All") && (
                <span key={key} className="text-xs bg-white border border-blue-200 px-3 py-1.5 rounded-full text-slate-600 shadow-sm">
                  <span className="font-bold text-slate-800 mr-1">{key}:</span> 
                  {value.toString()}
                </span>
              )
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

    const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== '_id');

    return (
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Captured Records ({data.length})</h4>
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm max-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                <tr>
                {headers.map(header => (
                    <th key={header} className="px-4 py-3 whitespace-nowrap font-semibold border-b border-slate-200">
                       {header.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {headers.map(header => {
                       let cellVal = row[header];
                       if (typeof cellVal === 'object' && cellVal !== null) {
                           cellVal = JSON.stringify(cellVal); 
                       }
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
      {renderFilters()}
      {renderDataTable()}
    </div>
  );
};

// --- MAIN COMPONENT ---
const Reports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Basic Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Exact date picker
  
  // NEW FILTER STATES
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");

  const [showPreview, setShowPreview] = useState(false); 
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const API_URL = "http://localhost:3000/api/reports"; 

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to connect");
      const data = await res.json();

      const formattedData = data.map(item => ({
        ...item,
        id: item._id || item.id, 
      }));

      setRecords(formattedData);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Compute unique categories dynamically from the data
  const uniqueCategories = useMemo(() => {
      const cats = new Set(records.map(r => r.type));
      return ["All", ...Array.from(cats)];
  }, [records]);

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      await fetch(`${API_URL}/${deleteRow.id}`, { method: 'DELETE' });
      setRecords(records.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const handleArchive = async (rowToArchive) => {
    if (!rowToArchive) return;
    const nextActiveList = records.filter((r) => r.id !== rowToArchive.id);
    setRecords(nextActiveList);
  };

  // --- UPDATED FILTERING LOGIC ---
  const filtered = records.filter((report) => {
    const reportDate = new Date(report.createdAt || report.date);
    const now = new Date();

    // 1. Search Query
    const matchesSearch =
      report.id?.toString().includes(searchQuery) ||
      report.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Exact Date (from FilterBar)
    const matchesDate = !selectedDate || reportDate.toDateString() === new Date(selectedDate).toDateString();

    // 3. Status
    const matchesStatus = activeStatus === "All" || report.status?.toLowerCase() === activeStatus.toLowerCase();

    // 4. Category (New)
    const matchesCategory = selectedCategory === "All" || report.type === selectedCategory;

    // 5. Time Range (New)
    let matchesTimeRange = true;
    if (timeRange !== "All") {
        if (timeRange === "This Week") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            matchesTimeRange = reportDate >= oneWeekAgo;
        } else if (timeRange === "This Month") {
            matchesTimeRange = reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
        } else if (timeRange === "This Year") {
            matchesTimeRange = reportDate.getFullYear() === now.getFullYear();
        }
    }

    return matchesSearch && matchesDate && matchesStatus && matchesCategory && matchesTimeRange;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

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
            <ExportMenu />
          </div>
        </div>
      </div>

      {/* --- NEW FILTER SECTION --- */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Category Filter */}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Tag size={16} />
            </div>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 hover:border-slate-300 appearance-none cursor-pointer"
            >
                {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
            </select>
        </div>

        {/* Time Period Filter */}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={16} />
            </div>
            <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 hover:border-slate-300 appearance-none cursor-pointer"
            >
                <option value="All">All Time</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
            </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Layers size={16} />
            </div>
            <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 hover:border-slate-300 appearance-none cursor-pointer"
            >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
            </select>
        </div>
      </div>
      {/* --------------------------- */}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading reports...</div>
      ) : (
        <Table
          columns={["Report ID", "Type", "Author", "Date", "Status"]}
          data={paginatedData.map((report) => ({
            ...report,
            reportid: report.id ? report.id.substring(0, 8).toUpperCase() : "ERR",
            date: new Date(report.createdAt || report.date).toLocaleDateString(),
          }))}
          actions={(row) => (
            <div className="flex justify-end items-center space-x-2">
              <TableActions onView={() => setViewRow(row)} onEdit={() => setEditRow(row)} onDelete={() => setDeleteRow(row)} />
              <button onClick={() => handleArchive(row)} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">
                <Archive size={16} />
              </button>
              <button onClick={() => setDeleteRow(row)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filtered.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filtered.length}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
      />

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
                 <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        viewRow.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        {viewRow.status}
                    </span>
                 </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <Field label="Source Module" value={viewRow.type} />
                   <Field label="Generated By" value={viewRow.author} />
                   <Field label="Submission Date" value={viewRow.date} />
                </div>
                <hr className="border-slate-100 mb-6" />
                <DataRenderer reportPayload={viewRow.data} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
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

      {editRow && (
        <EditReport
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            const next = records.map((r) => (r.id === updated.id ? updated : r));
            setRecords(next);
            setEditRow(null);
          }}
        />
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