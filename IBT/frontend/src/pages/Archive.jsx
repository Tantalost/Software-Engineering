import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import FilterBar from "../components/common/Filterbar";
import Field from "../components/common/Field";
import { Eye, RotateCcw, Trash2, CalendarDays, Loader2, X, ListChecks } from "lucide-react";
import { logActivity } from "../utils/logger";
import NotificationToast from "../components/common/NotificationToast";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;

const Archive = () => {
  const role = localStorage.getItem("authRole") || "superadmin";

  
  const availableTabs = useMemo(() => {
    switch (role) {
      case "superadmin": return ["All", "Bus Trip", "Parking Ticket", "Tenant", "Report", "Lost & Found", "Terminal Fee"];
      case "bus": return ["Bus Trip"];
      case "ticket": return ["Terminal Fee"];
      case "parking": return ["Parking Ticket"];
    
      case "tenant":
      case "tenant admin":
      case "tenantadmin":
      case "lease":
        return ["Tenant"];
      case "lostandfound": return ["Lost & Found"];
      default: return ["All"];
    }
  }, [role]);

  const getDefaultTab = () => {
    switch (role) {
      case "superadmin": return "All";
      case "bus": return "Bus Trip";
      case "ticket": return "Terminal Fee";
      case "parking": return "Parking Ticket";
      case "tenant":
      case "tenant admin":
      case "tenantadmin":
      case "lease":
        return "Tenant";
      case "lostandfound": return "Lost & Found";
      default: return "All";
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("All Time");

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [viewRow, setViewRow] = useState(null);
  const [restoreRow, setRestoreRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [allArchivedItems, setAllArchivedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);


  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: '',
    message: '',
    autoClose: true,
    duration: 3000
  });

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
      const timer = setTimeout(() => {
        setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 });
      }, notificationState.duration);
      return () => clearTimeout(timer);
    }
  }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]);

  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      
      const resLegacy = await fetch(`${API_URL}/archives`);
      const legacyData = resLegacy.ok ? await resLegacy.json() : [];

      const moduleEndpoints = [
        { type: "Bus Trip", url: "/bustrips/archived" },
        { type: "Terminal Fee", url: "/terminal-fees/archived" },
        { type: "Parking Ticket", url: "/parking/archived" },
        { type: "Lost & Found", url: "/lostfound/archived" },
        { type: "Report", url: "/reports/archived" },
        { type: "Tenant", url: "/tenants/archived" }
      ];

      const newArchivedResults = await Promise.all(
        moduleEndpoints.map(async (mod) => {
          try {
            const res = await fetch(`${API_URL}${mod.url}`);
            if (!res.ok) return [];
            const data = await res.json();

            return data.map(item => ({
              _id: item._id,
              id: item._id,
              type: mod.type,
              description: mod.type === "Bus Trip" ? `Trip: ${item.templateNo}` :
                mod.type === "Terminal Fee" ? `Ticket #${item.ticketNo}` :
                  mod.type === "Parking Ticket" ? `Plate #${item.plateNo}` :
                   mod.type === "Lost & Found" ? `Item: ${item.itemType || 'Unknown'} (${item.trackingNo})` :
                      mod.type === "Tenant" ? `Tenant: ${item.tenantName || item.name}` :
                        `${mod.type} Report`,
              dateArchived: item.updatedAt,
              isSoftDeleted: true, 
              originalData: item
            }));
          } catch { return []; }
        })
      );

      setAllArchivedItems([...legacyData, ...newArchivedResults.flat()]);
    } catch (e) {
      console.error("Failed to load archives", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

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
      if (role === "bus" && item.type !== "Bus Trip") return false;
      if (role === "ticket" && item.type !== "Terminal Fee") return false;
      if (role === "parking" && item.type !== "Parking Ticket") return false;
      
      if ((role === "tenant" || role === "tenant admin" || role === "tenantadmin" || role === "lease") && item.type !== "Tenant") return false;
      
      if (role === "lostandfound" && item.type !== "Lost & Found") return false;

      const matchesTab = activeTab === "All" || item.type === activeTab;
      const matchesSearch = (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = selectedDate
        ? new Date(item.dateArchived).toDateString() === new Date(selectedDate).toDateString()
        : checkTimeRange(item.dateArchived);

      return matchesTab && matchesSearch && matchesDate;
    });
  }, [allArchivedItems, activeTab, searchQuery, selectedDate, timeRange, role]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleRestore = async () => {
    if (!restoreRow) return;
    try {
      let res;
      const id = restoreRow._id || restoreRow.id;

      if (restoreRow.isSoftDeleted) {
        const moduleMap = {
          "Bus Trip": "bustrips",
          "Terminal Fee": "terminal-fees",
          "Parking Ticket": "parking",
          "Lost & Found": "lostfound",
          "Report": "reports",
          "Tenant": "tenants" 
        };
        const endpoint = moduleMap[restoreRow.type];
        res = await fetch(`${API_URL}/${endpoint}/${id}/restore`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" }
        });
      } else {
      
        res = await fetch(`${API_URL}/archives/restore/${id}`, { method: "POST" });
      }

      if (!res.ok) throw new Error("Restore failed");
      await logActivity(role, "RESTORE_ITEM", `Restored ${restoreRow.description}`, "Archive");

      setRestoreRow(null);
      fetchArchives();

      setNotificationState({
        isOpen: true,
        type: 'success',
        message: "Item restored successfully!",
        autoClose: true,
        duration: 3000
      });

    } catch (e) {
      console.error("Restore Error", e);
   
      setNotificationState({
        isOpen: true,
        type: 'error',
        message: "Failed to restore item.",
        autoClose: true,
        duration: 3000
      });
    }
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} items? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedIds.map(async (id) => {
        const item = allArchivedItems.find(i => (i._id === id || i.id === id));
        if (item?.isSoftDeleted) {
        
          const moduleMap = { "Bus Trip": "bustrips", "Terminal Fee": "terminal-fees", "Parking Ticket": "parking", "Lost & Found": "lostfound", "Report": "reports" };
          return fetch(`${API_URL}/${moduleMap[item.type]}/${id}`, { method: "DELETE" });
        }
        return fetch(`${API_URL}/archives/${id}`, { method: "DELETE" });
      }));
      await logActivity(role, "BULK_DELETE", `Permanently deleted ${selectedIds.length} items`, "Archive");
      setSelectedIds([]);
      fetchArchives();
      setIsSelectionMode(false);
    } catch (e) {
      console.error("Delete Error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const tableColumns = isSelectionMode
    ? [
      <div key="header-check" className="flex items-center">
        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
      </div>,
      "Type", "Description", "Date Archived"
    ]
    : ["Type", "Description", "Date Archived"];

  return (
    <Layout title="Archive Management">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={(d) => { setSelectedDate(d); setTimeRange("All Time"); }} />
        <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
          <CalendarDays size={18} className="text-slate-500" />
          <select value={timeRange} onChange={(e) => { setTimeRange(e.target.value); setSelectedDate(""); }} className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer">
            {["All Time", "Today", "Last 7 Days", "Last 30 Days", "This Year", "Last Year"].map(tr => <option key={tr} value={tr}>{tr}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-2 bg-slate-100 rounded-xl p-1">
          {availableTabs.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); setSelectedIds([]); }} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform active:scale-95 cursor-pointer ${activeTab === tab ? "bg-white text-emerald-700 shadow-md" : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isSelectionMode && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 px-2">{selectedIds.length} Selected</span>
              <button onClick={handleBulkDelete} className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 cursor-pointer"><Trash2 className="h-5 w-5" /></button>
            </div>
          )}
          <button onClick={() => { if (isSelectionMode) setSelectedIds([]); setIsSelectionMode(!isSelectionMode); }} className={`flex items-center justify-center cursor-pointer h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${isSelectionMode ? "bg-red-500 text-white shadow-md border-red-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
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
            const rowData = { ...item, id: id, datearchived: item.dateArchived ? new Date(item.dateArchived).toLocaleString() : "N/A" };
            if (isSelectionMode) {
              return { select: (<div className="flex items-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /></div>), ...rowData };
            }
            return rowData;
          })}
          actions={(row) => {
            const fullItem = allArchivedItems.find(i => (i._id === row.id) || (i.id === row.id));
            return (
              <div className="flex justify-end items-center space-x-2">
                <button onClick={() => setViewRow(fullItem)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"><Eye size={16} /></button>
                <button onClick={() => setRestoreRow(fullItem)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all cursor-pointer"><RotateCcw size={16} /></button>
              </div>
            );
          }}
        />
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filteredItems.length} onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }} />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4"><h3 className="text-base font-semibold text-slate-800">View Archived Item</h3><button onClick={() => setViewRow(null)} className="text-slate-500 hover:text-slate-700 cursor-pointer"><X size={20} /></button></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm"><Field label="Archive ID" value={viewRow._id || viewRow.id} /><Field label="Item Type" value={viewRow.type} /><Field label="Description" value={viewRow.description} /><Field label="Date Archived" value={new Date(viewRow.dateArchived).toLocaleString()} /></div>
            <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 cursor-pointer">Close</button></div>
          </div>
        </div>
      )}

      {restoreRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><RotateCcw size={24} /></div>
            <h3 className="text-lg font-bold text-slate-800">Restore Item</h3>
            <p className="mt-2 text-sm text-slate-600">Restore <strong>{restoreRow.description}</strong> back to its original collection?</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setRestoreRow(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-pointer">Cancel</button>
              <button onClick={handleRestore} className="flex-1 py-2.5 bg-emerald-600 rounded-lg text-white font-medium hover:bg-emerald-700 shadow-lg cursor-pointer">Restore</button>
            </div>
          </div>
        </div>
      )}

      <NotificationToast
        isOpen={notificationState.isOpen}
        type={notificationState.type}
        message={notificationState.message}
        onClose={() => setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 })}
      />
    </Layout>
  );
};

export default Archive;