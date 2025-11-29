import React, { useState, useMemo, useEffect } from "react";
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
import { Trash2, LogOut, Car, Bike, Clock, FileText, DollarSign } from "lucide-react";

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

  // --- 3. Handle Add New ---
  const handleAddClick = () => {
    const now = new Date();
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedTimeIn = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setNewTicket({
      ticketNo: "",
      type: "Car",
      plateNumber: "",
      baseRate: 50, 
      timeIn: formattedTimeIn, 
    });
    setShowAddModal(true);
  };

  const handleVehicleTypeChange = (type) => {
    const rate = type === "Car" ? 50 : 20; 
    setNewTicket(prev => ({ ...prev, type, baseRate: rate }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
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

  // --- 5. Helper to Format Date ---
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
                {row.status === "Parked" && (
                     <button 
                        onClick={() => setLogoutRow(getRawRecord(row.id))} 
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 px-2"
                     >
                     <LogOut size={16} /> <span className="text-xs font-medium">Depart</span>
                 </button>
                )}
                <TableActions 
                    onView={() => setViewRow(getRawRecord(row.id))} 
                    onEdit={() => setEditRow(getRawRecord(row.id))} 
                    onDelete={() => setDeleteRow(getRawRecord(row.id))} 
                />
              </div>
            )}
          />
      )}
      
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filtered.length} onItemsPerPageChange={setItemsPerPage} />

    {/* --- ADD MODAL --- */}
    {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">New Parking Entry</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleCreateTicket}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Vehicle Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" onClick={() => handleVehicleTypeChange("Car")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${newTicket.type === "Car" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}>
                                <Car size={32} className="mb-2" />
                                <span className="font-medium">Car / Bus</span>
                                <span className="text-xs opacity-75">₱50.00 / hr</span>
                            </button>
                            <button type="button" onClick={() => handleVehicleTypeChange("Motorcycle")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${newTicket.type === "Motorcycle" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}>
                                <Bike size={32} className="mb-2" />
                                <span className="font-medium">Motorcycle</span>
                                <span className="text-xs opacity-75">₱20.00 / hr</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Number</label>
                            <div className="relative">
                                <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input type="text" required value={newTicket.ticketNo} onChange={(e) => setNewTicket({...newTicket, ticketNo: e.target.value})} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="1001" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number</label>
                            <input 
                                type="text" 
                                list="plate-options" 
                                placeholder="ABC 123"
                                required
                                value={newTicket.plateNumber}
                                onChange={(e) => setNewTicket({...newTicket, plateNumber: e.target.value.toUpperCase()})}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                            />
                            <datalist id="plate-options">
                                {existingPlates.map((plate, index) => (
                                    <option key={index} value={plate} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Entry Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input type="datetime-local" value={newTicket.timeIn} onChange={(e) => setNewTicket({...newTicket, timeIn: e.target.value})} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input 
                                    type="number" 
                                    value={newTicket.baseRate} 
                                    readOnly 
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-medium shadow-md hover:bg-emerald-700 transition-all">Confirm Entry</button>
                    </div>
                </form>
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
        onConfirm={async () => { 
            if(deleteRow) { 
                await fetch(`${API_URL}/${deleteRow.id}`, {method: 'DELETE'}); 
                fetchParkingTickets(); 
                setDeleteRow(null); 
            } 
        }} 
        title="Delete Record" 
        message="Remove this record?" 
        itemName={deleteRow ? (deleteRow.ticketNo || "this item") : ""} 
      />

    </Layout>
  );
};

export default Parking;