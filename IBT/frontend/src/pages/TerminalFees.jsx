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
import { logActivity } from "../utils/logger";

const API_URL = "http://localhost:3000/api";

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

  const fetchFees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/terminal-fees`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Error fetching fees:", err);
      showToastMessage("Error loading data from server");
    } finally {
      setIsLoading(false);
    }
  };

 useEffect(() => {
    fetchFees();
  }, []);

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000); 
  };

  const executeUpdate = async (data) => {
    try {
      const idToUpdate = data._id || data.id;

      const res = await fetch(`${API_URL}/terminal-fees/${idToUpdate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Update failed");

      await fetchFees(); 
      
      await logActivity(
        role, 
        "UPDATE_TICKET", 
        `Updated Ticket #${data.ticketNo}. Changed type to ${data.passengerType}.`, 
        "TerminalFees"
      );
      
      showToastMessage("Record updated successfully!"); 
    } catch (error) {
      console.error(error);
      showToastMessage("Failed to update record.");
    }
  };

 const handleEditSubmit = (updatedData) => {
    if (!editRow) return;
    
    const finalData = { ...editRow, ...updatedData };

    if (role === "superadmin") {
        executeUpdate(finalData); 
        setEditRow(null);        
    } 
    
    else if (role === "ticket") {
        setPendingEdit(finalData); 
        setEditRow(null); 
        setConfirmAction("edit"); 
        
        setPasswordInput(""); 
        setPasswordError("");
        setShowPasswordModal(true); 
    }
  };
  
  const executeDelete = async (id, ticketNo) => {
    try {
      const res = await fetch(`${API_URL}/terminal-fees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      await fetchFees();
      await logActivity(role, "DELETE_TICKET", `Deleted Ticket #${ticketNo}`, "TerminalFees");
      showToastMessage("Record deleted successfully!"); 
    } catch (error) {
       console.error(error);
       showToastMessage("Failed to delete record.");
    }
  };

  const handleDeleteProceed = async () => {
      if (!deleteRow) return;

      if (role === "ticket") {
          try {
            const res = await fetch(`${API_URL}/deletion-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: "Terminal Fee",
                    itemDescription: `Ticket #${deleteRow.ticketNo} - ${deleteRow.passengerType}`,
                    requestedBy: "Ticket Admin",
                    originalData: deleteRow, 
                    reason: deleteRemarks || "No remarks provided."
                })
            });

            if (!res.ok) throw new Error("Failed to send request");

            await logActivity(role, "REQUEST_DELETE", `Requested deletion: Ticket #${deleteRow.ticketNo}`, "TerminalFees");
            
            showToastMessage("Deletion request sent to Superadmin.");
            setDeleteRow(null);
            setDeleteRemarks(""); 

          } catch (e) {
            console.error("Error requesting deletion", e);
            showToastMessage("Failed to submit deletion request.");
          }
          return; 
      }

     if (role === "superadmin") {
          const idToDelete = deleteRow._id || deleteRow.id;

          if (!idToDelete) {
             console.error("Error: Record ID is missing", deleteRow);
             showToastMessage("System Error: Cannot delete (Missing ID)");
             return;
          }

          await executeDelete(idToDelete, deleteRow.ticketNo);
          
          setDeleteRow(null);
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
    const requiredPassword = role === "ticket" 
        ? (localStorage.getItem("ticketPassword") || "ticket123") 
        : (localStorage.getItem("authPassword") || "admin123");

    if (passwordInput === requiredPassword) {
      
      const recordId = pendingEdit?._id || pendingEdit?.id;

      if (!pendingEdit || !recordId) {
          setPasswordError("System Error: Lost record ID. Please refresh and try again.");
          return;
      }

      if (confirmAction === "edit") {
          executeUpdate(pendingEdit); 
      } 
      else if (confirmAction === "delete") {
          executeDelete(recordId, pendingEdit.ticketNo); 
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

  const handleSaveNew = async () => {
    try {
      const res = await fetch(`${API_URL}/terminal-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket)
      });

      if (!res.ok) throw new Error("Failed to save to database");
      
      await fetchFees(); 

      await logActivity(
        role,                                                                       
        "CREATE_TICKET",                                                            
        `Created Ticket #${newTicket.ticketNo} - ${newTicket.passengerType}`,       
        "TerminalFees"                                                             
      );

      showToastMessage("New ticket added successfully!"); 
      setShowAddModal(false);

    } catch (error) {
      console.error("Error saving ticket:", error);
      showToastMessage("Failed to save ticket. Please check server connection.");
    }
  };

  const handleArchive = async (rowToArchive) => {
    try {
      const archiveRes = await fetch(`${API_URL}/archives`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             type: "Terminal Fee",
             description: `Ticket #${rowToArchive.ticketNo} - ${rowToArchive.passengerType}`,
             originalData: rowToArchive,
             archivedBy: role
          })
      });

      if (!archiveRes.ok) throw new Error("Failed to archive");

      const idToDelete = rowToArchive._id || rowToArchive.id;

      if (!idToDelete) {
          throw new Error("System Error: Record ID is missing.");
      }

      const deleteRes = await fetch(`${API_URL}/terminal-fees/${idToDelete}`, { 
          method: "DELETE" 
      });

      if (!deleteRes.ok) throw new Error("Failed to remove from active list");

      await fetchFees(); 
      await logActivity(role, "ARCHIVE_TICKET", `Archived Ticket #${rowToArchive.ticketNo}`, "TerminalFees");
      showToastMessage("Ticket archived successfully!"); 

    } catch (e) {
      console.error("Failed to archive:", e);
      showToastMessage("Failed to archive ticket.");
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
            id: fee._id || fee.id,
            ticketno: fee.ticketNo,
            passengertype: fee.passengerType, 
            time: fee.time,
            date: fee.date,
            price: `₱${fee.price.toFixed(2)}`,
          }))}

          actions={(row) => {
            const selectedRecord = records.find(r => (r._id || r.id) == row.id);

            return (
              <div className="flex justify-end items-center space-x-2">
                <TableActions
                  onView={() => setViewRow(selectedRecord)}
                  onEdit={() => setEditRow(selectedRecord)}
                /> 
                <button 
                  onClick={() => {
                    if (selectedRecord) {
                        handleArchive(selectedRecord);
                    } else {
                      console.error("Error: Could not find record for ID:", row.id);
                    }
                  }} 
                  className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                  title="Archive">
                  <Archive size={16} />
                </button>

                <button 
                  onClick={() => { 
                    setDeleteRow(selectedRecord); 
                    setDeleteRemarks(""); 
                  }} 
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }}
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