import React, { useState, useMemo, useEffect } from "react";
import { Archive, Trash2, Plus, X, CheckCircle, Loader2, History } from "lucide-react"; 

import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";

import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";

import SelectField from "../components/common/SelectField";

import Pagination from "../components/common/Pagination";

import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import ViewModal from "../components/common/ViewModal";
import EditModal from "../components/common/EditModal";
import DeleteModal from "../components/common/DeleteModal"; 
import LogModal from "../components/common/LogModal"; 
import SecurityCheckModal from "../components/common/SecurityCheckModal"; 
import RequestDeletionModal from "../components/common/RequestDeletionModal"; 
import StatCardGroupTerminal from "../components/terminal/StatCardGroupTerminal";
import TerminalFilter from "../components/terminal/TerminalFilter";
import { tickets } from "../data/assets"; 

const TerminalFees = () => {
  const role = localStorage.getItem("authRole") || "superadmin"; 
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false); 
  const [showNotify, setShowNotify] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEdit, setPendingEdit] = useState(null); 
  const [confirmAction, setConfirmAction] = useState(null); 
  const [deleteRemarks, setDeleteRemarks] = useState(""); 
  const [toast, setToast] = useState(null);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    passengerType: "Regular",
    price: 15.00,
    date: "",
    time: ""
  });

  useEffect(() => {
    setIsLoading(true);
    const raw = localStorage.getItem("ibt_terminalFees");
    setRecords(raw ? JSON.parse(raw) : tickets);
    
    const timer = setTimeout(() => setIsLoading(false), 500); 
    return () => clearTimeout(timer);
  }, []);

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_terminalFees", JSON.stringify(next));
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000); 
  };

  const logActivity = (action, details) => {
    try {
      const rawLogs = localStorage.getItem("ibt_activity_logs");
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: role,
        action: action,
        details: details
      };
      
      logs.unshift(newLog); 
      localStorage.setItem("ibt_activity_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  };

  const handleEditSubmit = (updatedData) => {
    if (!editRow) return;
    const finalData = { ...editRow, ...updatedData };
    setPendingEdit(finalData); 
    setEditRow(null); 
    setConfirmAction("edit");
    
    setPasswordInput(""); 
    setPasswordError("");
    setShowPasswordModal(true); 
  };

  const handleDeleteProceed = () => {
      if (!deleteRow) return;

      if (role === "ticket") {
          try {
            const reqs = JSON.parse(localStorage.getItem("ibt_deletion_requests") || "[]");
            const newRequest = {
              id: `REQ-${Date.now()}`,
              itemType: "Terminal Fee",
              itemDescription: `Ticket #${deleteRow.ticketNo} - ${deleteRow.passengerType}`,
              requestedBy: "Ticket Admin",
              requestDate: new Date().toISOString(),
              status: "pending",
              originalData: deleteRow,
              reason: deleteRemarks || "No remarks provided." 
            };
            
            reqs.push(newRequest);
            localStorage.setItem("ibt_deletion_requests", JSON.stringify(reqs));

            const nextList = records.filter((r) => r.id !== deleteRow.id);
            persist(nextList);

            logActivity("REQUEST_DELETE", `Requested deletion: Ticket #${deleteRow.ticketNo}. Reason: ${deleteRemarks}`);
            showToastMessage("Deletion request sent to Superadmin.");
            
            setDeleteRow(null);
            setDeleteRemarks(""); 
          } catch (e) {
            console.error("Error requesting deletion", e);
          }
          return; 
      }
      setPendingEdit(deleteRow);
      setDeleteRow(null);
      setConfirmAction("delete");
      
      setPasswordInput("");
      setPasswordError("");
      setShowPasswordModal(true);
  };

  const handleFinalizeAction = () => {
    let requiredPassword = "";

    if (role === "ticket") {
        requiredPassword = localStorage.getItem("ticketPassword") || "ticket123";
    } else {
        requiredPassword = localStorage.getItem("authPassword") || "admin123";
    }

    if (passwordInput === requiredPassword) {
      if (!pendingEdit || !pendingEdit.id) {
          setPasswordError("System Error: Lost record ID.");
          return;
      }

      if (confirmAction === "edit") {
          const next = records.map(r => (r.id === pendingEdit.id ? { ...r, ...pendingEdit } : r));
          persist(next);
          logActivity("UPDATE_TICKET", `Updated Ticket #${pendingEdit.ticketNo}. Changed type to ${pendingEdit.passengerType}.`);
          showToastMessage("Record updated successfully!"); 
      } 
      else if (confirmAction === "delete") {
          const nextList = records.filter((r) => r.id !== pendingEdit.id);
          persist(nextList); 
          logActivity("DELETE_TICKET", `Deleted Ticket #${pendingEdit.ticketNo} - ${pendingEdit.passengerType}`);
          showToastMessage("Record deleted successfully!"); 
      }

      setShowPasswordModal(false);
      setPendingEdit(null);
      setConfirmAction(null);
      setPasswordInput("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };


  const handleOpenAdd = () => {
    const maxTicket = records.length > 0 ? Math.max(...records.map(r => Number(r.ticketNo) || 0)) : 0;
    const now = new Date();
    
    setNewTicket({
      ticketNo: maxTicket + 1,
      passengerType: "Regular",
      price: 15.00, 
      date: now.toISOString().split('T')[0], 
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    });
    setShowAddModal(true);
  };

  const handleSaveNew = () => {
    const newItem = { id: Date.now(), ...newTicket };
    const nextList = [newItem, ...records]; 
    persist(nextList);
    
    logActivity("CREATE_TICKET", `Created Ticket #${newItem.ticketNo} - ${newItem.passengerType}`);
    showToastMessage("New ticket added successfully!"); 
    setShowAddModal(false);
  };

  const handleArchive = (rowToArchive) => {
    try {
      const rawArchive = localStorage.getItem("ibt_archive");
      const archiveList = rawArchive ? JSON.parse(rawArchive) : [];

      const archiveItem = {
        id: `archive-${Date.now()}-${rowToArchive.id}`,
        type: "Terminal Fee",
        description: `Ticket #${rowToArchive.ticketNo} - ${rowToArchive.passengerType}`,
        dateArchived: new Date().toISOString(),
        originalData: rowToArchive 
      };
      
      archiveList.push(archiveItem);
      localStorage.setItem("ibt_archive", JSON.stringify(archiveList));
      logActivity("ARCHIVE_TICKET", `Archived Ticket #${rowToArchive.ticketNo}`);
      showToastMessage("Ticket archived successfully!"); 

      const nextActiveList = records.filter((r) => r.id !== rowToArchive.id);
      persist(nextActiveList);
    } catch (e) {
      console.error("Failed to add to archive:", e);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((fee) => {
      const matchesSearch = fee.passengerType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = selectedDate ? new Date(fee.date).toDateString() === new Date(selectedDate).toDateString() : true;
      const matchesType = activeType === "All" || fee.passengerType.toLowerCase().includes(activeType.toLowerCase());
      return matchesSearch && matchesDate && matchesType;
    });
  }, [records, searchQuery, selectedDate, activeType]);

  const stats = useMemo(() => ({
    regular: filtered.filter(f => (f.passengerType || "").toLowerCase() === "regular").length,
    student: filtered.filter(f => (f.passengerType || "").toLowerCase() === "student").length,
    senior: filtered.filter(f => (f.passengerType || "").toLowerCase() === "senior citizen / pwd").length,
    total: filtered.length,
    revenue: filtered.reduce((sum, f) => sum + (f.price || 0), 0)
  }), [filtered]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);


  
  return (
    <Layout title="Terminal Fees Management">
      <div className="mb-6">
        <StatCardGroupTerminal
          regular={stats.regular}
          student={stats.student}
          senior={stats.senior}
          totalPassengers={stats.total}
          totalRevenue={stats.revenue}
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
          <button onClick={handleOpenAdd} className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all">
            <Plus size={18} /> <span>Add Fee</span>
          </button>

          {role === "superadmin" && (
            <>
              <button onClick={() => setShowLogModal(true)} title="View Activity Logs" className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                <History size={18} /> <span className="hidden sm:inline">Logs</span>
              </button>
              <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                Notify
              </button>
            </>
          )}

          {role === "ticket" && (
            <button onClick={() => setShowSubmitModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all">
              Submit Report
            </button>
          )}
          <ExportMenu onExportCSV={() => {}} onPrint={() => window.print()} />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <TerminalFilter activeType={activeType} onTypeChange={setActiveType} />
        {role === "ticket" && (
            <button onClick={() => setShowLogModal(true)} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 h-10 rounded-xl shadow-sm hover:border-slate-300">
                <History size={18} /> <span className="hidden sm:inline">Logs</span>
            </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl border-slate-200 bg-white/50">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500 font-medium">Loading records...</p>
        </div>
      ) : (
        <Table
            columns={["Ticket No", "Passenger Type", "Time", "Date", "Price"]}
            data={paginatedData.map((fee) => ({
              id: fee.id,
              ticketno: fee.ticketNo,
              passengertype: fee.passengerType, 
              time: fee.time,
              date: fee.date,
              price: `₱${fee.price.toFixed(2)}`,
            }))}
            actions={(row) => (
            <div className="flex justify-end items-center space-x-2">
                <TableActions
                  onView={() => setViewRow(records.find(r => r.id == row.id))}
                  onEdit={() => setEditRow(records.find(r => r.id == row.id))}
                />
                <button onClick={() => handleArchive(records.find(r => r.id == row.id))} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100">
                  <Archive size={16} />
                </button>
                <button onClick={() => { setDeleteRow(records.find(r => r.id == row.id)); setDeleteRemarks(""); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                  <Trash2 size={16} />
                </button>
            </div>
            )}
        />
      )}

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        />
      </div>

      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
        storageKey="ibt_activity_logs" 
      />

      <SecurityCheckModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingEdit(null); setPasswordInput(""); }}
        onConfirm={handleFinalizeAction}
        actionType={confirmAction}
        passwordInput={passwordInput}
        setPasswordInput={(val) => { setPasswordInput(val); setPasswordError(""); }}
        error={passwordError}
      />

      <RequestDeletionModal
        isOpen={role === "ticket" && !!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteProceed}
        itemIdentifier={deleteRow ? `Ticket #${deleteRow.ticketNo}` : ""}
        remarks={deleteRemarks}
        setRemarks={setDeleteRemarks}
      />

      {viewRow && (
        <ViewModal
          title="View Terminal Fee"
          fields={[
            { label: "Ticket No", value: viewRow.ticketNo },
            { label: "Passenger Type", value: viewRow.passengerType },
            { label: "Time", value: viewRow.time },
            { label: "Date", value: viewRow.date },
            { label: "Price", value: viewRow.price },
          ]}
          onClose={() => setViewRow(null)}
        />
      )}

      {role !== "ticket" && (
        <DeleteModal
            isOpen={!!deleteRow}
            onClose={() => setDeleteRow(null)}
            onConfirm={handleDeleteProceed} 
            title="Delete Record"
            message="Are you sure you want to remove this terminal fee record? This action cannot be undone."
            itemName={deleteRow ? `Ticket #${deleteRow.ticketNo}` : ""}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">New Terminal Fee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ticket No</label>
                <input type="text" value={newTicket.ticketNo} disabled className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg font-medium"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Passenger Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Regular", "Student", "Senior Citizen / PWD"].map((type) => (
                    <button key={type} onClick={() => {
                        const price = (type === 'Student' || type === 'Senior Citizen / PWD') ? 10.00 : 15.00;
                        setNewTicket(prev => ({ ...prev, passengerType: type, price }));
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold border ${newTicket.passengerType === type ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}
                    >
                      {type === "Senior Citizen / PWD" ? "Senior/PWD" : type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price</label>
                    <input type="number" value={newTicket.price} disabled className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg font-semibold"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                    <input type="text" value={newTicket.date} disabled className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg text-sm"/>
                  </div>
               </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSaveNew} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Save Ticket</button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <EditModal
          title="Edit Terminal Fee"
          initialData={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleEditSubmit} 
          fields={(form, set) => (
            <>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ticket No</label>
                  <input type="text" value={form.ticketNo} disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-500"/>
              </div>
              <SelectField
                label="Passenger Type"
                value={form.passengerType} 
                onChange={(e) => {
                    const newType = e.target.value;
                    set("passengerType", newType); 
                    set("price", (newType === "Student" || newType === "Senior Citizen / PWD") ? 10.00 : 15.00);
                }}
                options={["Regular", "Student", "Senior Citizen / PWD"]}
              />
              <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input type="number" value={form.price} disabled className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"/>
              </div>
            </>
          )}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 bg-slate-800 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in">
          <CheckCircle className="text-emerald-400" size={22} />
          <span className="font-semibold text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-white"><X size={16} /></button>
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
              <button onClick={() => { setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
            </div>
          </div>
        </div>
      )}
      
      {role === "ticket" && showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <h3 className="text-base font-semibold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to submit the current report?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { setShowSubmitModal(false); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Submit</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TerminalFees;