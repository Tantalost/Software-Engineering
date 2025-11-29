import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import StatCardGroupPark from "../components/parking/StatCardGroupPark";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditParking from "../components/parking/EditParking";
import DeleteModal from "../components/common/DeleteModal";
import ParkingFilter from "../components/parking/ParkingFilter";
// Added 'Archive' to imports
import { Trash2, LogOut, Car, Bike, Clock, FileText, DollarSign, ArrowLeft, Archive } from "lucide-react";

const Parking = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeType, setActiveType] = useState("All");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [logoutRow, setLogoutRow] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- NEW: Step State for the Form UI ---
  const [step, setStep] = useState(1);
  const plateInputRef = useRef(null);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = "http://localhost:3000/api/parking";

  // --- 1. Form State ---
  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    type: "Car", 
    plateNumber: "",
    baseRate: 50, 
    timeIn: "", 
  });

  // Calculate unique plates for Autocomplete
  const existingPlates = useMemo(() => {
    return [...new Set(records.map(r => r.plateNumber).filter(Boolean))];
  }, [records]);

  // --- 2. Fetch Data ---
  const fetchParkingTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const formattedData = data.map(item => ({ ...item, id: item._id }));
      setRecords(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchParkingTickets(); }, []);

  // --- Focus Effect for Step 2 ---
  useEffect(() => {
    if (showAddModal && step === 2 && plateInputRef.current) {
      plateInputRef.current.focus();
    }
  }, [step, showAddModal]);

  // --- 3. Handle Add New (Reset Form) ---
  const handleAddClick = () => {
    const now = new Date();
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedTimeIn = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setNewTicket({
      ticketNo: "",
      type: "", // Reset type so user is forced to choose
      plateNumber: "",
      baseRate: 50, 
      timeIn: formattedTimeIn, 
    });
    setStep(1); // Always start at Step 1
    setShowAddModal(true);
  };

  // Selection Handler (Step 1 -> Step 2)
  const handleSelectType = (type) => {
    const rate = type === "Car" ? 50 : 20; 
    setNewTicket(prev => ({ ...prev, type: type, baseRate: rate }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setNewTicket(prev => ({ ...prev, type: "", plateNumber: "", ticketNo: "" }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault(); 
    
    if (!newTicket.plateNumber || !newTicket.ticketNo) {
        alert("Please fill in both fields.");
        return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (response.ok) {
        fetchParkingTickets();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  // --- 4. Handle Departure ---
  const confirmLogout = async () => {
    if (!logoutRow) return;
    try {
        const response = await fetch(`${API_URL}/${logoutRow.id}/depart`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            fetchParkingTickets(); 
            setLogoutRow(null);
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
  };

  // --- 5. Handle Archive (Soft Delete) ---
  const handleArchive = async (row) => {
    // Optional: Add a confirm check if desired
    // if(!window.confirm("Archive this ticket?")) return;

    try {
        const response = await fetch(`${API_URL}/${row.id}`, {
            method: "PUT", // Assuming your API supports PUT for updates
            headers: { "Content-Type": "application/json" },
            // We update status to Archived. Adjust 'isArchived' based on your backend schema
            body: JSON.stringify({ ...row, status: "Archived", isArchived: true }),
        });
        if(response.ok) {
            // Remove from current view immediately
            setRecords(prev => prev.filter(r => r.id !== row.id));
        }
    } catch (error) {
        console.error("Error archiving:", error);
    }
  };

  // --- 6. Handle Delete Confirm ---
  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
        const response = await fetch(`${API_URL}/${deleteRow.id}`, {
            method: "DELETE",
        });
        if(response.ok) {
            setRecords(prev => prev.filter(r => r.id !== deleteRow.id));
        }
    } catch (error) {
        console.error("Error deleting:", error);
    } finally {
        setDeleteRow(null);
    }
  };

  // --- 7. Helper to Format Date ---
  const formatDateDisplay = (dateString) => {
      if(!dateString) return "--/--";
      return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatTimeOnly = (dateString) => {
      if(!dateString) return "--:--";
      return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  // Helper to get the RAW data object for Modals
  const getRawRecord = (id) => {
    return records.find(r => r.id === id);
  };

  // --- Filtering ---
  const filtered = records.filter((ticket) => {
    const matchesSearch = 
      (ticket.ticketNo && String(ticket.ticketNo).includes(searchQuery)) ||
      (ticket.plateNumber && ticket.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Date Filtering Fix
    const ticketDate = ticket.timeIn ? new Date(ticket.timeIn).toDateString() : "";
    const filterDate = selectedDate ? new Date(selectedDate).toDateString() : "";
    const matchesDate = !selectedDate || ticketDate === filterDate;

    const matchesType = activeType === "All" || ticket.type.toLowerCase() === activeType.toLowerCase();
    return matchesSearch && matchesType && matchesDate;
  });
  
  // Stats
  const carCount = filtered.filter((t) => t.type === "Car").length;
  const motoCount = filtered.filter((t) => t.type === "Motorcycle").length;
  const revenue = filtered.reduce((sum, t) => sum + (Number(t.finalPrice) || 0), 0);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Helper for Badge Styles in Modal
  const getBadgeStyles = () => {
    if (newTicket.type === 'Car') {
      return "bg-blue-50 text-blue-600 border-blue-600";
    }
    return "bg-orange-50 text-orange-500 border-orange-500";
  };

  return (
    <Layout title="Bus Parking Management">
      
      <div className="mb-6">
        <StatCardGroupPark cars={carCount} motorcycles={motoCount} totalVehicles={filtered.length} totalRevenue={revenue} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex items-center justify-end gap-3">
          <button onClick={handleAddClick} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all">
            + Add New
          </button>
          <ExportMenu />
        </div>
      </div>

      <div className="mb-4">
        <ParkingFilter activeType={activeType} onTypeChange={setActiveType} />
      </div>
        
      {isLoading ? (
          <div className="text-center py-10">Loading tickets...</div>
      ) : (
          <Table
            columns={["Ticket No", "Plate No", "Type", "Fee/Hr", "Total", "Time In", "Time Out", "Duration", "Status"]}
            data={paginatedData.map((ticket) => ({
              id: ticket.id,
              ticketNo: ticket.ticketNo ? `#${ticket.ticketNo}` : <span className="text-slate-300">---</span>,
              plateNumber: ticket.plateNumber ? <span className="font-mono font-semibold text-slate-700">{ticket.plateNumber}</span> : <span className="text-slate-300">---</span>,
              type: ticket.type,
              baseRate: ticket.baseRate ? `₱${ticket.baseRate}` : <span className="text-slate-300">---</span>,
              finalPrice: ticket.status === "Departed" ? <span className="font-bold text-emerald-600">₱{ticket.finalPrice}</span> : <span className="text-slate-400">---</span>,
              timeIn: formatTimeOnly(ticket.timeIn),
              timeOut: ticket.timeOut ? formatTimeOnly(ticket.timeOut) : "---",
              duration: ticket.duration || "---",
              status: ticket.status,
            }))}
            actions={(row) => (
              <div className="flex justify-end items-center space-x-2">
                {/* Depart Button */}
                {row.status === "Parked" && (
                     <button 
                        onClick={() => setLogoutRow(getRawRecord(row.id))} 
                        title="Depart / Logout"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 px-2"
                      >
                      <LogOut size={16} /> <span className="text-xs font-medium">Depart</span>
                  </button>
                )}
                
                {/* View / Edit Actions */}
                <TableActions 
                    onView={() => setViewRow(getRawRecord(row.id))} 
                    onEdit={() => setEditRow(getRawRecord(row.id))} 
                    // onDelete removed from here to separate the button below
                />

                {/* Archive Button */}
                <button 
                    onClick={() => handleArchive(getRawRecord(row.id))} 
                    title="Archive" 
                    className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
                >
                    <Archive size={16} />
                </button>

                {/* Delete Button */}
                <button 
                    onClick={() => setDeleteRow(getRawRecord(row.id))} 
                    title="Delete" 
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            )}
          />
      )}
      
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filtered.length} onItemsPerPageChange={setItemsPerPage} />

    {/* --- NEW ADD MODAL (STEP-BY-STEP DESIGN) --- */}
    {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[600px] rounded-3xl shadow-2xl p-8 md:p-10 text-center transition-all duration-300 relative">
                
                {/* Close Button */}
                <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
                    ✕
                </button>

                {/* Header */}
                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    {step === 1 ? "Select Vehicle" : "Enter Details"}
                </h1>

                {/* STEP 1: Selection Grid */}
                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-300">
                        {/* Car Button */}
                        <button 
                            onClick={() => handleSelectType('Car')}
                            className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] border-[3px] border-blue-600 bg-blue-50 text-blue-600 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                        >
                            <Car size={80} className="mb-4" />
                            <span className="text-2xl font-bold mt-2">CAR / BUS</span>
                            <span className="text-sm opacity-70 mt-1 font-medium">₱50.00 / hr</span>
                        </button>

                        {/* Motorcycle Button */}
                        <button 
                            onClick={() => handleSelectType('Motorcycle')}
                            className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] border-[3px] border-orange-500 bg-orange-50 text-orange-500 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                        >
                            <Bike size={80} className="mb-4" />
                            <span className="text-2xl font-bold mt-2">MOTORCYCLE</span>
                            <span className="text-sm opacity-70 mt-1 font-medium">₱20.00 / hr</span>
                        </button>
                    </div>
                )}

                {/* STEP 2: Input Form */}
                {step === 2 && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        
                        {/* Selected Badge */}
                        <div>
                            <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold border-2 ${getBadgeStyles()}`}>
                                Selected: {newTicket.type === 'Car' ? 'Car / Bus' : 'Motorcycle'}
                            </span>
                        </div>

                        {/* Plate Input */}
                        <div className="text-left">
                            <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">
                                Plate Number
                            </label>
                            <input 
                                ref={plateInputRef}
                                type="text" 
                                list="plate-options"
                                placeholder="ABC 1234" 
                                value={newTicket.plateNumber}
                                onChange={(e) => setNewTicket({...newTicket, plateNumber: e.target.value.toUpperCase()})}
                                className="w-full p-5 text-2xl border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-colors uppercase"
                            />
                            {/* Preserve Autocomplete Logic */}
                            <datalist id="plate-options">
                                {existingPlates.map((plate, index) => (
                                    <option key={index} value={plate} />
                                ))}
                            </datalist>
                        </div>

                        {/* Ticket Input */}
                        <div className="text-left">
                            <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">
                                Ticket Number
                            </label>
                            <input 
                                type="number" 
                                placeholder="001" 
                                value={newTicket.ticketNo}
                                onChange={(e) => setNewTicket({...newTicket, ticketNo: e.target.value})}
                                className="w-full p-5 text-2xl border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 mt-4 h-16">
                            <button 
                                onClick={handleBack}
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-500 border-2 border-gray-300 text-xl font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={24} /> Back
                            </button>
                            <button 
                                onClick={handleCreateTicket}
                                className="flex-[2] bg-emerald-500 text-white text-2xl font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                                ENTER
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )}

    {/* --- DEPART CONFIRMATION --- */}
    {logoutRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogOut size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Confirm Departure</h3>
                <p className="text-slate-600 mt-2 text-sm">
                    Ticket <strong>{logoutRow.ticketNo}</strong> is leaving.<br/>
                    The system will calculate the total price based on duration.
                </p>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => setLogoutRow(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
                    <button onClick={confirmLogout} className="flex-1 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 shadow-lg">Process Payment</button>
                </div>
            </div>
        </div>
    )}

      {/* View Modal */}
      {viewRow && ( 
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
                <h3 className="mb-4 text-base font-semibold text-slate-800">View Parking Ticket</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                    {/* Handles missing data safely */}
                    <Field label="Ticket No" value={viewRow.ticketNo || "N/A"} />
                    <Field label="Plate No" value={viewRow.plateNumber || "N/A"} />
                    <Field label="Type" value={viewRow.type} />
                    <Field label="Base Rate" value={viewRow.baseRate ? `₱${viewRow.baseRate}` : "N/A"} />
                    <Field label="Final Price" value={viewRow.finalPrice ? `₱${viewRow.finalPrice}` : "Pending"} />
                    <Field label="Time In" value={formatDateDisplay(viewRow.timeIn)} />
                    <Field label="Time Out" value={formatDateDisplay(viewRow.timeOut)} />
                    <Field label="Duration" value={viewRow.duration} />
                    <Field label="Status" value={viewRow.status} />
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRow && (
        <EditParking
            row={editRow}
            onClose={() => setEditRow(null)}
            onSave={async (updatedData) => {
                await fetch(`${API_URL}/${updatedData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                fetchParkingTickets();
                setEditRow(null);
            }}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal 
        isOpen={!!deleteRow} 
        onClose={() => setDeleteRow(null)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Record" 
        message="Are you sure you want to permanently remove this record?" 
        itemName={deleteRow ? (deleteRow.ticketNo ? `Ticket #${deleteRow.ticketNo}` : "this item") : ""} 
      />

    </Layout>
  );
};

export default Parking;