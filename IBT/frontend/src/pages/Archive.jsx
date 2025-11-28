import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import FilterBar from "../components/common/Filterbar";
import Field from "../components/common/Field"; 
import { Eye, RotateCcw, Trash2, CalendarDays } from "lucide-react";

const Archive = () => {
  const role = localStorage.getItem("authRole");
  const availableTabs = useMemo(() => {
    if (role === "ticket") {
      return ["Terminal Fee"];
    }
    return ["All", "Bus Trip", "Parking Ticket", "Tenant", "Report", "Lost & Found", "Terminal Fee"];
  }, [role]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("All");
  
  const [activeTab, setActiveTab] = useState(role === "ticket" ? "Terminal Fee" : "All");
  
  const [viewRow, setViewRow] = useState(null);
  const [restoreRow, setRestoreRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadArchived = () => {
    try {
      const raw = localStorage.getItem("ibt_archive");
      const data = raw ? JSON.parse(raw) : []; 
      return data;
    } catch (e) {
      return []; 
    }
  };

  const [allArchivedItems, setAllArchivedItems] = useState(loadArchived());

  const persistArchive = (next) => {
    setAllArchivedItems(next);
    localStorage.setItem("ibt_archive", JSON.stringify(next));
  };

  const checkTimeRange = (itemDate) => {
    const date = new Date(itemDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (timeRange === "All") return true;
    
    if (timeRange === "Today") {
      return itemDay.getTime() === today.getTime();
    }
    
    if (timeRange === "This Week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay()); 
      return itemDay >= firstDayOfWeek && itemDay <= today;
    }
    
    if (timeRange === "This Month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    
    if (timeRange === "This Year") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const filteredItems = useMemo(() => {
    return allArchivedItems.filter((item) => {
      if (role === "ticket" && item.type !== "Terminal Fee") {
        return false;
      }

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

  const handleRestore = () => {
    if (!restoreRow) return;

    const itemType = restoreRow.type;
    let storageKey = "";
    if (itemType === "Bus Trip") storageKey = "ibt_busTrips";
    else if (itemType === "Parking Ticket") storageKey = "ibt_parking";
    else if (itemType === "Report") storageKey = "ibt_reports";
    else if (itemType === "Tenant") storageKey = "ibt_TenantLease";
    else if (itemType === "Lost & Found") storageKey = "ibt_lostFound";
    else if (itemType === "Terminal Fee") storageKey = "ibt_terminalFees";

    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        const activeList = raw ? JSON.parse(raw) : [];
        activeList.push(restoreRow.originalData);
        localStorage.setItem(storageKey, JSON.stringify(activeList));
      } catch (e) {
        console.error("Failed to restore item to active list:", e);
      }
    }

    const nextArchive = allArchivedItems.filter((item) => item.id !== restoreRow.id);
    persistArchive(nextArchive);
    setRestoreRow(null);
  };

  const handleDeletePermanently = () => {
    if (!deleteRow) return;
    const nextArchive = allArchivedItems.filter((item) => item.id !== deleteRow.id);
    persistArchive(nextArchive);
    setDeleteRow(null);
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    setSelectedDate(""); 
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) setTimeRange("All"); 
  };

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
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-100 rounded-xl p-1 mb-4">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1); 
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

      <Table
        columns={["Type", "Description", "Date Archived", "Original Status"]}
        data={paginatedData.map((item) => ({
          ...item,
          dateArchived: new Date(item.dateArchived).toLocaleString(),
        }))}
        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <button
              onClick={() => setViewRow(row)}
              title="View"
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setRestoreRow(row)}
              title="Restore"
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setDeleteRow(row)}
              title="Delete Permanently"
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
        totalItems={filteredItems.length}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Archived Item: {viewRow.type}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Archive ID" value={viewRow.id} />
              <Field label="Item Type" value={viewRow.type} />
              <Field label="Description" value={viewRow.description} />
              <Field label="Date Archived" value={new Date(viewRow.dateArchived).toLocaleString()} />
              <Field label="Original Status" value={viewRow.originalStatus} />
            </div>
            <h4 className="mt-4 mb-2 text-sm font-semibold text-slate-600">Original Data</h4>
            <pre className="bg-slate-50 p-3 rounded-lg text-xs overflow-auto">
              {JSON.stringify(viewRow.originalData, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {restoreRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-800">Restore Item</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to restore this item? It will be moved from the archive and placed back into the active "{restoreRow.type}" list.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRestoreRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={handleRestore} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Restore</button>
            </div>
          </div>
        </div>
      )}

      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-800">Delete Permanently</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete this item? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={handleDeletePermanently} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
      
    </Layout>
  );
};

export default Archive;