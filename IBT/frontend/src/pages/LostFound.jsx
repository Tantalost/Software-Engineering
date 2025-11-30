import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditLostFound from "../components/lostfound/EditLostFound";
import DeleteModal from "../components/common/DeleteModal";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import LostFoundStatusFilter from "../components/lostfound/LostFoundStatusFilter";
import { submitPageReport } from "../utils/reportService.js"; // <--- IMPORT SERVICE
// Added Loader2
import { Archive, Trash2, Package, FileText, Calendar, MapPin, Tag, Loader2 } from "lucide-react";

const LostFound = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  // Notify States
  const [showNotify, setShowNotify] = useState(false);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- REPORTING STATES ---
  const [isReporting, setIsReporting] = useState(false);
  // ------------------------

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = "http://localhost:3000/api/lostfound";

  // --- 1. New Item State ---
  const [newItem, setNewItem] = useState({
    trackingNo: "",
    description: "",
    dateTime: "",
    status: "Unclaimed",
  });

  // --- 2. Fetch Data ---
  const fetchLostFound = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      // Map _id to id
      const formattedData = data.map(item => ({
        ...item,
        id: item._id
      }));
      setRecords(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLostFound();
  }, []);

  // --- 3. Handle Add New ---
  const handleAddClick = () => {
    // Generate a simple tracking number based on timestamp for convenience
    const autoTracking = `LF-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const formattedNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setNewItem({
      trackingNo: autoTracking,
      description: "",
      location: "",
      dateTime: formattedNow,
      status: "Unclaimed"
    });
    setShowAddModal(true);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (response.ok) {
        fetchLostFound();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  // --- 4. Handle Update ---
  const handleUpdateRecord = async (updatedData) => {
    try {
      const response = await fetch(`${API_URL}/${updatedData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) {
        fetchLostFound();
        setEditRow(null);
      }
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  // --- 5. Handle Delete ---
  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setRecords(prev => prev.filter(r => r.id !== deleteRow.id));
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeleteRow(null);
    }
  };

  // --- 6. Handle Archive (Soft Delete logic usually) ---
  const handleArchive = async (row) => {
    // For now, we will just use the standard Delete for functionality, 
    // or you can implement a PUT { isArchived: true } if your backend supports it.
    // Here is the Soft Delete implementation:
    try {
      const response = await fetch(`${API_URL}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, isArchived: true, status: "Archived" }),
      });
      if (response.ok) {
        // Remove from current view
        setRecords(prev => prev.filter(r => r.id !== row.id));
      }
    } catch (error) {
      console.error("Error archiving:", error);
    }
  };

  // --- Filtering Logic ---
  const filtered = records.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trackingNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !selectedDate || new Date(item.dateTime).toDateString() === new Date(selectedDate).toDateString();

    const matchesStatus = activeStatus === "All" || item.status.toLowerCase() === activeStatus.toLowerCase();

    return matchesSearch && matchesDate && matchesStatus;
  });

  // --- SUBMIT REPORT HANDLER ---
  // --- UPDATED SUBMIT HANDLER ---
  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      // 1. Format Data & Remove Unwanted Columns
      const formattedData = filtered.map(item => {
        // Destructure to separate unwanted fields
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;

        return {
          ...rest, // Keep trackingNo, description, location, status, etc.
          // Format the DateTime to be readable (e.g., "11/30/2025, 2:30 PM")
          dateTime: rest.dateTime ? new Date(rest.dateTime).toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : "-"
        };
      });

      // 2. Package Data
      const reportPayload = {
        screen: "Lost & Found Log",
        generatedDate: new Date().toLocaleString(), // Readable report date
        filters: {
          searchQuery,
          selectedDate: selectedDate ? new Date(selectedDate).toLocaleDateString() : "None",
          activeStatus
        },
        statistics: {
          totalItems: records.length,
          displayedItems: filtered.length,
          unclaimed: filtered.filter(i => i.status === "Unclaimed").length,
          claimed: filtered.filter(i => i.status === "Claimed").length
        },
        data: formattedData // <--- Send cleaned data
      };

      // 3. Submit to Backend
      await submitPageReport("Lost & Found", reportPayload, "LostFound Admin");

      // 4. Clear Table (Bulk Delete)
      const deletePromises = filtered.map(item =>
        fetch(`${API_URL}/${item.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      // 5. Update UI
      alert("Report submitted successfully! The table has been cleared.");
      setShowSubmitModal(false);
      fetchLostFound();

    } catch (error) {
      console.error(error);
      alert("Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };
  // -----------------------------

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Helper for Date Display
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString() + " " + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

          {/* --- SUBMIT REPORT BUTTON (Visible to 'lostfound' or 'superadmin') --- */}
          {(role === "lostfound") && (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isReporting}
              className="flex items-center justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
            >
              <FileText size={18} />
              <span>Submit Report</span>
            </button>
          )}
          {/* ------------------------------------------------------------------- */}

          <button onClick={handleAddClick} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
            + Add New
          </button>

          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-sm hover:border-slate-300 transition-all flex items-center justify-center">
              Notify
            </button>
          )}

          <div className="h-[44px] flex items-center">
            <ExportMenu />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <LostFoundStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading records...</div>
      ) : (
        <Table
          columns={["Tracking No", "Description", "Location", "DateTime", "Status"]}
          data={paginatedData.map((item) => ({
            id: item.id,
            trackingno: item.trackingNo,
            description: item.description,
            location: item.location,
            datetime: formatDateTime(item.dateTime),
            status: item.status,
          }))}
          actions={(row) => (
            <div className="flex justify-end items-center space-x-2">
              <TableActions
                onView={() => setViewRow(records.find(r => r.id === row.id))}
                onEdit={() => setEditRow(records.find(r => r.id === row.id))}
                onDelete={() => setDeleteRow(records.find(r => r.id === row.id))}
              />
              <button onClick={() => handleArchive(row)} title="Archive" className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">
                <Archive size={16} />
              </button>
              <button onClick={() => setDeleteRow(row)} title="Delete" className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}

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

      {/* --- ADD NEW MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Log Lost/Found Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                    {["Unclaimed", "Claimed"].map((status) => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setNewItem({ ...newItem, status })}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newItem.status === status
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
                  <div className="relative">
                    <Package size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={newItem.trackingNo}
                      onChange={(e) => setNewItem({ ...newItem, trackingNo: e.target.value })}
                      disabled className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 "
                      placeholder="LF-123456"
                      required
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time Found/Reported</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={newItem.dateTime}
                      onChange={(e) => setNewItem({ ...newItem, dateTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-35"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
                      placeholder="Detailed description of the item..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      value={newItem.location}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300  "
                      placeholder="Location of the item found..."
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-medium shadow-md hover:bg-emerald-700 transition-all">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Lost/Found</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Tracking No" value={viewRow.trackingNo} />
              <Field label="Status" value={viewRow.status} />
              <Field label="DateTime" value={formatDateTime(viewRow.dateTime)} />
              <div className="md:col-span-2"><Field label="Description" value={viewRow.description} /></div>
              <div className="md:col-span-2"><Field label="Location" value={viewRow.location} /></div>
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRow && (
        <EditLostFound
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleUpdateRecord}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this record?"
        itemName={deleteRow ? `Track #${deleteRow.trackingNo}` : ""}
      />

      {/* Submit Report Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to capture and submit the current Lost & Found report?
              <br />
              <span className="text-red-500 font-semibold text-xs">
                Note: This will clear the current table for new entries.
              </span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isReporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Modal */}
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
              <button onClick={() => { setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LostFound;