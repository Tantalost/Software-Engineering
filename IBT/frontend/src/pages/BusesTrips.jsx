import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import Form from "../components/common/Form";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditBusTrip from "../components/bustrips/EditBusTrip";
import DeleteModal from "../components/common/DeleteModal";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import { Archive, Trash2 } from "lucide-react";

const BusTrips = () => {
    const [records, setRecords] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [showNotify, setShowNotify] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const role = localStorage.getItem("authRole") || "superadmin";

    const API_URL = "http://localhost:3000/api/bustrips";

    const fetchBusTrips = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();

            // Map MongoDB _id to id for your frontend components
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

    // --- 2. Handle Delete (API Call) ---
    const handleDeleteConfirm = async () => {
        if (!deleteRow) return;

        try {
            const response = await fetch(`${API_URL}/${deleteRow.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Remove from local state immediately for UI responsiveness
                setRecords(prev => prev.filter((r) => r.id !== deleteRow.id));
                console.log("Item deleted successfully");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        } finally {
            setDeleteRow(null);
        }
    };

    // --- 3. Handle Update (Passed to EditBusTrip) ---
    const handleUpdateRecord = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/${updatedData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                const savedItem = await response.json();
                // Update local state
                setRecords(prev => prev.map(r => (r.id === savedItem._id ? { ...savedItem, id: savedItem._id } : r)));
                setEditRow(null);
            }
        } catch (error) {
            console.error("Error updating:", error);
        }
    };

    const handleCreateRecord = async (newData) => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newData),
            });
            if (response.ok) {
                fetchBusTrips(); // Refresh list
                setShowPreview(false);
            }
        } catch (error) {
            console.error("Error creating:", error);
        }
    };

    // --- 5. Handle Archive (Optional Logic) ---
    // Note: Usually Archive is just an Update Status, but keeping your logic similar:
    const handleArchive = async (rowToArchive) => {
        if (!rowToArchive) return;
        // Option A: Delete from Main DB and add to Archive DB
        // Option B (Recommended): Just update a flag "isArchived: true"

        // Implementing Option B (Update status):
        try {
            const response = await fetch(`${API_URL}/${rowToArchive.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: true, status: "Archived" }),
            });

            if (response.ok) {
                setRecords(prev => prev.filter((r) => r.id !== rowToArchive.id));
                console.log("Item archived successfully!");
            }
        } catch (error) {
            console.error("Archive failed:", error);
        }
    };

    // --- Filtering Logic (Stays Client-Side for now) ---
    const filtered = records.filter((bus) => {
        const templateNo = bus.templateNo || bus.templateno || ""; // handle case sensitivity
        const matchesSearch =
            templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.route.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCompany =
            selectedCompany === "" || bus.company === selectedCompany;

        const matchesDate =
            !selectedDate ||
            new Date(bus.date).toDateString() === new Date(selectedDate).toDateString();

        return matchesSearch && matchesCompany && matchesDate;
    });

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    }, [filtered, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // Export Handlers (keep as is)
    const handleExportCSV = () => console.log("Exported Bus Trips to CSV");
    const handleExportExcel = () => console.log("Exported Bus Trips to Excel");
    const handleExportPDF = () => console.log("Exported Bus Trips to PDF");
    const handlePrint = () => window.print();

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
                        {/* UPDATE: Ensure Add New triggers your create logic */}
                        <button onClick={() => setShowPreview(true)} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                            + Add New
                        </button>
                        {/* ... Rest of buttons ... */}
                        {role === "superadmin" && (
                            <button onClick={() => setShowNotify(true)} className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all w-full sm:w-auto">
                                Notify
                            </button>
                        )}
                         <ExportMenu 
                            onExportCSV={handleExportCSV} 
                            onExportExcel={handleExportExcel} 
                            onExportPDF={handleExportPDF} 
                            onPrint={handlePrint} 
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-8">
                {isLoading ? (
                    <div className="text-center py-10">Loading data...</div>
                ) : (
                    <Table
                        columns={["Template No", "Route", "Time", "Date", "Company", "Status"]}
                        data={paginatedData.map((bus) => ({
                            id: bus.id,
                            templateno: bus.templateNo || bus.templateno, // Handle casing
                            route: bus.route,
                            time: bus.time,
                            date: bus.date,
                            company: bus.company,
                            status: bus.status,
                        }))}
                        actions={(row) => (
                            <div className="flex justify-end items-center space-x-2">
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
                    onItemsPerPageChange={(newItemsPerPage) => {
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1);
                    }}
                />
            </div>

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
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal - Connected to API via handleUpdateRecord */}
            {editRow && (
                <EditBusTrip
                    row={editRow}
                    onClose={() => setEditRow(null)}
                    onSave={handleUpdateRecord} 
                />
            )}

            {/* Add New Modal - Needs to be connected to handleCreateRecord */}
            {showPreview && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl bg-white rounded-xl p-6">
                        {/* NOTE: You need to update your <Form> component or this section 
                           to capture the form data state and call handleCreateRecord(formData) 
                           instead of just closing it.
                        */}
                        <Form
                            title="Add New Bus Trip"
                            onSubmit={(formData) => handleCreateRecord(formData)} // Hypothetical prop
                            onCancel={() => setShowPreview(false)} // Hypothetical prop
                            fields={[
                                { name: "templateNo", label: "Template No", type: "text" },
                                { name: "route", label: "Route", type: "text" },
                                { name: "time", label: "Time", type: "time" },
                                { name: "date", label: "Date", type: "date" },
                                { name: "company", label: "Company", type: "text" },
                                { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
                            ]}
                        />
                         <div className="mt-3 flex justify-end">
                            <button onClick={() => setShowPreview(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to remove this bus record? This action cannot be undone."
                itemName={deleteRow ? `Template #${deleteRow.templateno}` : ""}
            />

            {role === "bus" && showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
                        <h3 className="text-base font-semibold text-slate-800">Submit Bus Report</h3>
                        <p className="mt-2 text-sm text-slate-600">Are you sure you want to submit the current bus report?</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                            <button onClick={() => { setShowSubmitModal(false); console.log('Parking report submitted.'); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Submit</button>
                        </div>
                    </div>
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
                            <button onClick={() => { const raw = localStorage.getItem("ibt_notifications"); const list = raw ? JSON.parse(raw) : []; list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Bus Trips" }); localStorage.setItem("ibt_notifications", JSON.stringify(list)); setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
                        </div>
                    </div>
                </div>
            )}

            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl">
                        <Form
                            title="Bus Trips Management"
                            fields={[
                                { label: "Template No", type: "text" },
                                { label: "Route", type: "text" },
                                { label: "Time", type: "time" },
                                { label: "Date", type: "date" },
                                { label: "Company", type: "text" },
                                { label: "Status", type: "select", options: ["Active", "Inactive"] },
                            ]}
                        />
                        <div className="mt-3 flex justify-end">
                            <button onClick={() => setShowPreview(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BusTrips;