import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import TableActions from "../components/common/TableActions"; // Assuming this handles View/Edit/Delete
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditBusTrip from "../components/bustrips/EditBusTrip";
import DeleteModal from "../components/common/DeleteModal";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import { Archive, Trash2, LogOut, CheckCircle } from "lucide-react";

// Mock Data for Templates (You can move this to a DB or Config later)
const TEMPLATE_ROUTES = {
    "T-101": "Iligan - Cagayan de Oro",
    "T-102": "Iligan - Pagadian",
    "T-103": "Iligan - Zamboanga",
    "T-104": "Iligan - Dipolog"
};

const BusTrips = () => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false); // Renamed from showPreview for clarity
    const [viewRow, setViewRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [logoutRow, setLogoutRow] = useState(null); // New state for Log Out flow
    
    // Notification States
    const [showNotify, setShowNotify] = useState(false);
    const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const role = localStorage.getItem("authRole") || "superadmin";
    const API_URL = "http://localhost:3000/api/bustrips";

    // --- New Bus Form State ---
    const [newBusData, setNewBusData] = useState({
        templateNo: "",
        route: "",
        company: "Dindo", // Default tab
        time: "",
        date: new Date().toISOString().split('T')[0], // Default today
        status: "Pending" // Default status on add
    });

    // --- Log Out Form State ---
    const [ticketRefInput, setTicketRefInput] = useState("");

    const fetchBusTrips = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            const formattedData = data.map(item => ({
                ...item,
                id: item._id,
            }));
            setRecords(formattedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusTrips();
    }, []);

    const uniqueCompanies = [...new Set(records.map((bus) => bus.company))];

    // --- HANDLE ADD NEW BUS ---
    const handleAddClick = () => {
        // Reset form when opening
        setNewBusData({
            templateNo: "",
            route: "",
            company: "Dindo",
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), // Auto Current Time
            date: new Date().toISOString().split('T')[0],
            status: "Pending"
        });
        setShowAddModal(true);
    };

    const handleTemplateChange = (e) => {
        const tempNo = e.target.value;
        setNewBusData(prev => ({
            ...prev,
            templateNo: tempNo,
            route: TEMPLATE_ROUTES[tempNo] || "" // Auto-fill Route
        }));
    };

    const handleCreateRecord = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBusData),
            });
            if (response.ok) {
                fetchBusTrips();
                setShowAddModal(false);
            }
        } catch (error) {
            console.error("Error creating:", error);
        }
    };

    // --- HANDLE LOG OUT (DEPARTURE) ---
    const handleLogoutClick = (row) => {
        setLogoutRow(row);
        setTicketRefInput(""); // Reset input
    };

    const confirmLogout = async () => {
        if (!logoutRow || !ticketRefInput) return;

        const updatedData = {
            ...logoutRow,
            ticketReferenceNo: ticketRefInput,
            status: "Paid", // Automatically set to Paid
            departureTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // Optional: Record departure time
        };

        try {
            const response = await fetch(`${API_URL}/${logoutRow.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                // Update local state immediately
                setRecords(prev => prev.map(r => (r.id === logoutRow.id ? updatedData : r)));
                setLogoutRow(null);
            }
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // --- EXISTING HANDLERS (Update, Delete, Archive) ---
    const handleDeleteConfirm = async () => {
        if (!deleteRow) return;
        try {
            const response = await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
            if (response.ok) {
                setRecords(prev => prev.filter((r) => r.id !== deleteRow.id));
            }
        } catch (error) { console.error("Error deleting:", error); } 
        finally { setDeleteRow(null); }
    };

    const handleUpdateRecord = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/${updatedData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (response.ok) {
                const savedItem = await response.json();
                setRecords(prev => prev.map(r => (r.id === savedItem._id ? { ...savedItem, id: savedItem._id } : r)));
                setEditRow(null);
            }
        } catch (error) { console.error("Error updating:", error); }
    };

    const handleArchive = async (rowToArchive) => {
        // Logic for archive...
        console.log("Archive logic here for", rowToArchive);
    };

    // --- FILTERING ---
    const filtered = records.filter((bus) => {
        const templateNo = bus.templateNo || bus.templateno || "";
        const matchesSearch =
            templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.route.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCompany = selectedCompany === "" || bus.company === selectedCompany;
        const matchesDate = !selectedDate || new Date(bus.date).toDateString() === new Date(selectedDate).toDateString();
        return matchesSearch && matchesCompany && matchesDate;
    });

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <Layout title="Bus Trips Management">
            <div className="px-4 lg:px-8 mt-4">
                <div className="flex flex-col gap-4 w-full">
                    <BusTripFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedCompany={selectedCompany}
                        setSelectedCompany={setSelectedCompany}
                        uniqueCompanies={uniqueCompanies}
                    />
                    <div className="flex justify-end sm:justify-end w-full sm:w-auto gap-5">
                        <button onClick={handleAddClick} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                            + Add Bus
                        </button>
                        
                        {role === "superadmin" && (
                            <button onClick={() => setShowNotify(true)} className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all w-full sm:w-auto">
                                Notify
                            </button>
                        )}
                        <ExportMenu />
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-8">
                {isLoading ? (
                    <div className="text-center py-10">Loading data...</div>
                ) : (
                    <Table
                        columns={["Template No", "Route", "Time", "Date", "Company", "Status", "Ticket Ref"]}
                        data={paginatedData.map((bus) => ({
                            id: bus.id,
                            templateno: bus.templateNo || bus.templateno,
                            route: bus.route,
                            time: bus.time,
                            date: bus.date,
                            company: bus.company,
                            status: bus.status,
                            ticketReferenceNo: bus.ticketReferenceNo || "-"
                        }))}
                        actions={(row) => (
                            <div className="flex justify-end items-center space-x-2">
                                {row.status === "Pending" && (
                                    <button 
                                        onClick={() => handleLogoutClick(row)} 
                                        title="Log Out (Depart)"
                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 px-2"
                                    >
                                        <LogOut size={16} /> 
                                        <span className="text-xs font-medium">Depart</span>
                                    </button>
                                )}
                                
                                <TableActions
                                    onView={() => setViewRow(row)}
                                    onEdit={() => setEditRow(row)}
                                    onDelete={() => setDeleteRow(row)}
                                />
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
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filtered.length}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>

            {/* --- ADD NEW BUS MODAL  --- */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
                        <h3 className="mb-4 text-xl font-bold text-slate-800">Add New Bus Trip</h3>
                        <form onSubmit={handleCreateRecord}>
                            <div className="space-y-4">
                                
                                {/* 1. Company Tabs */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                                    <div className="flex p-1 bg-slate-100 rounded-lg">
                                        {["Dindo", "Alga Ceres", "Lizamae"].map((company) => (
                                            <button
                                                type="button"
                                                key={company}
                                                onClick={() => setNewBusData({ ...newBusData, company })}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                                    newBusData.company === company
                                                        ? "bg-white text-emerald-600 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700"
                                                }`}
                                            >
                                                {company}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Template Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Template No.</label>
                                    <select
                                        required
                                        value={newBusData.templateNo}
                                        onChange={handleTemplateChange}
                                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="">Select Template</option>
                                        {Object.keys(TEMPLATE_ROUTES).map(key => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. Route (Auto-filled) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                                    <input
                                        type="text"
                                        value={newBusData.route}
                                        readOnly
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                                        placeholder="Auto-filled based on template"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 4. Arrival Time (Auto) */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
                                        <input
                                            type="time"
                                            value={newBusData.time}
                                            onChange={(e) => setNewBusData({...newBusData, time: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                                        />
                                    </div>
                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newBusData.date}
                                            onChange={(e) => setNewBusData({...newBusData, date: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                
                                {/* Status Information */}
                                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Status will be set to <strong>Pending</strong>
                                </div>

                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                                >
                                    Save Bus Trip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- LOG OUT / DEPARTURE MODAL --- */}
            {logoutRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg transform transition-all">
                        <div className="mb-4 flex items-center gap-3 text-emerald-600">
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Confirm Departure</h3>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-4">
                            You are about to log out bus <strong>{logoutRow.templateno}</strong> ({logoutRow.company}). 
                            Please enter the ticket reference number to proceed.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Reference No.</label>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Enter reference number..."
                                value={ticketRefInput}
                                onChange={(e) => setTicketRefInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        
                         <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-100 mb-4">
                             Status will change from <strong>Pending</strong> to <strong>Paid</strong>.
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setLogoutRow(null)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                disabled={!ticketRefInput}
                                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                    ticketRefInput 
                                    ? "bg-emerald-600 hover:bg-emerald-700" 
                                    : "bg-emerald-300 cursor-not-allowed"
                                }`}
                            >
                                Confirm Departure
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* View Modal */}
            {viewRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
                        <h3 className="mb-4 text-base font-semibold text-slate-800">View Bus Trip</h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                            <Field label="Template No" value={viewRow.templateno} />
                            <Field label="Route" value={viewRow.route} />
                            <Field label="Time" value={viewRow.time} />
                            <Field label="Date" value={viewRow.date} />
                            <Field label="Company" value={viewRow.company} />
                            <Field label="Status" value={viewRow.status} />
                            <Field label="Ticket Ref" value={viewRow.ticketReferenceNo || "N/A"} />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editRow && (
                <EditBusTrip
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
                message="Are you sure you want to remove this bus record?"
                itemName={deleteRow ? `Template #${deleteRow.templateno}` : ""}
            />

            {/* Notification Modal */}
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
                            <button onClick={() => { 
                                const raw = localStorage.getItem("ibt_notifications"); 
                                const list = raw ? JSON.parse(raw) : []; 
                                list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Bus Trips" }); 
                                localStorage.setItem("ibt_notifications", JSON.stringify(list)); 
                                setShowNotify(false); 
                                setNotifyDraft({ title: "", message: "" }); 
                            }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BusTrips;