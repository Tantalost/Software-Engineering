import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import FilterBar from "../components/common/Filterbar";
import Field from "../components/common/Field"; 
import { Eye, RotateCcw, Trash2, CalendarDays, Loader2, X, ListChecks } from "lucide-react";
import { logActivity } from "../utils/logger"; 

const API_URL = "http://localhost:3000/api"; 

const Archive = () => {
  const role = localStorage.getItem("authRole");
  const availableTabs = useMemo(() => {
    if (role === "ticket") {
      return ["Terminal Fee"];
    }
    return ["All", "Bus Trip", "Parking Ticket", "Tenant", "Report", "Lost & Found", "Terminal Fee"];
  }, [role]);

  // -- State Management --
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("All Time");
  const [activeTab, setActiveTab] = useState(role === "ticket" ? "Terminal Fee" : "All");
  
  // Modal States
  const [viewRow, setViewRow] = useState(null);
  const [restoreRow, setRestoreRow] = useState(null);
  // Removed deleteRow state for single delete as requested
  
  // Pagination & Data
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [allArchivedItems, setAllArchivedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // -- Selection State --
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // -- Fetch Data --
  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/archives`);
      if (res.ok) {
        const data = await res.json();
        setAllArchivedItems(data);
      }
    } catch (e) {
      console.error("Failed to load archives", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // -- Timeline Logic --
  const checkTimeRange = (itemDate) => {
    if (!itemDate) return false;
    const date = new Date(itemDate);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    switch (timeRange) {
      case "All Time": return true;
      case "Today": return itemDay.getTime() === today.getTime();
      case "Last 7 Days":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return date >= sevenDaysAgo && date <= now;
      case "Last 30 Days":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return date >= thirtyDaysAgo && date <= now;
      case "This Year": return date.getFullYear() === now.getFullYear();
      case "Last Year": return date.getFullYear() === (now.getFullYear() - 1);
      default: return true;
    }
  };

  const filteredItems = useMemo(() => {
    return allArchivedItems.filter((item) => {
      if (role === "ticket" && item.type !== "Terminal Fee") return false;

      const matchesTab = activeTab === "All" || item.type === activeTab;
      const matchesSearch =
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (selectedDate) {
        matchesDate = new Date(item.dateArchived).toDateString() === new Date(selectedDate).toDateString();
      } else {
        matchesDate = checkTimeRange(item.dateArchived);
      }

      return matchesTab && matchesSearch && matchesDate;
    });
  }, [allArchivedItems, activeTab, searchQuery, selectedDate, timeRange, role]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // -- Selection Handlers --
  const toggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedData.map((item) => item._id || item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedData.map((item) => item._id || item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item._id || item.id));

  // -- Action Handlers --
  const handleRestore = async () => {
    if (!restoreRow) return;
    try {
      const res = await fetch(`${API_URL}/archives/restore/${restoreRow._id || restoreRow.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Restore failed");
      await logActivity(role, "RESTORE_ITEM", `Restored ${restoreRow.description}`, "Archive");
      setRestoreRow(null);
      fetchArchives(); 
    } catch (e) {
      console.error("Restore Error", e);
      alert("Failed to restore item.");
    }
  };

  // Bulk Delete (This is the only way to delete now)
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} items? \n\nThis action cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => fetch(`${API_URL}/archives/${id}`, { method: "DELETE" })));
      await logActivity(role, "BULK_DELETE", `Permanently deleted ${selectedIds.length} items`, "Archive");
      setSelectedIds([]);
      fetchArchives();
      setIsSelectionMode(false);
      alert(`Successfully deleted ${selectedIds.length} items.`);
    } catch (e) {
      console.error("Bulk Delete Error", e);
      alert("Failed to delete some items.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    setSelectedDate(""); 
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) setTimeRange("All Time"); 
  };

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
      "Type", "Description", "Date Archived"
    ]
  : ["Type", "Description", "Date Archived"];

  return (
    <Layout title="Archive Management">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-3">
        <div className="flex-1">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange} 
            placeholder="Search descriptions..."
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
          <CalendarDays size={18} className="text-slate-500" />
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Year">This Year</option>
            <option value="Last Year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-2 bg-slate-100 rounded-xl p-1">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1); 
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform active:scale-95 ${
                activeTab === tab
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
           {isSelectionMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                    {selectedIds.length} Selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    title="Delete Selected"
                    className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all cursor-pointer"
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
            ? "bg-red-500 text-white shadow-md cursor-pointer hover:bg-red-600 border-red-600"
            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer"
            }`}
          >
            {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : (
        <Table
            columns={tableColumns}
            data={paginatedData.map((item) => {
                const id = item._id || item.id;
                
                const rowData = {
                  ...item,
                  id: id,
                  // FIX: Removed seconds using toLocaleString options
                  datearchived: item.dateArchived ? new Date(item.dateArchived).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    // second: '2-digit' // Removed this
                  }) : "N/A",
                };

                if (isSelectionMode) {
                  return {
                    select: (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox"
                                checked={selectedIds.includes(id)}
                                onChange={() => handleToggleSelect(id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>
                    ),
                    ...rowData
                  };
                }

                return rowData;
            })}
            actions={(row) => {
             const fullItem = allArchivedItems.find(i => (i._id === row.id) || (i.id === row.id));
             return (
                <div className="flex justify-end items-center space-x-2">
                    <button
                    onClick={() => setViewRow(fullItem)}
                    title="View"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                    >
                    <Eye size={16} />
                    </button>
                    <button
                    onClick={() => setRestoreRow(fullItem)}
                    title="Restore"
                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                    >
                    <RotateCcw size={16} />
                    </button>
                    {/* DELETE BUTTON REMOVED FROM HERE */}
                </div>
             );
            }}
        />
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredItems.length}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {/* View Modal */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-800">View Archived Item</h3>
                <button onClick={() => setViewRow(null)} className="text-slate-500 hover:text-slate-700"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Archive ID" value={viewRow._id || viewRow.id} />
              <Field label="Item Type" value={viewRow.type} />
              <Field label="Description" value={viewRow.description} />
              <Field label="Date Archived" value={new Date(viewRow.dateArchived).toLocaleString()} />
            </div>
            
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-800">Restore Item</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to restore <strong>{restoreRow.description}</strong>? It will be moved back to active status.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRestoreRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={handleRestore} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Restore</button>
            </div>
          </div>
        </div>
      )}
      
    </Layout>
  );
};

export default Archive;