import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import { busSchedules } from "../data/assets";
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

    const uniqueCompanies = [...new Set(busSchedules.map((bus) => bus.company))];

    const loadStored = () => {
        try {
            const raw = localStorage.getItem("ibt_busTrips");
            return raw ? JSON.parse(raw) : busSchedules;
        } catch (e) {
            return busSchedules;
        }
    };

    const [records, setRecords] = useState(loadStored());

    const persist = (next) => {
        setRecords(next);
        localStorage.setItem("ibt_busTrips", JSON.stringify(next));
    };

    const handleDeleteConfirm = () => {
    if (!deleteRow) return;

    const nextList = records.filter((r) => r.id !== deleteRow.id);
    
    persist(nextList); 
    setDeleteRow(null); 
    console.log("Item deleted successfully");
  };

    const handleArchive = (rowToArchive) => {
        if (!rowToArchive) return;

        try {
            const rawArchive = localStorage.getItem("ibt_archive");
            const archiveList = rawArchive ? JSON.parse(rawArchive) : [];

            const archiveItem = {
                id: `archive-${Date.now()}-${rowToArchive.id}`,
                type: "Bus Trip", 
                description: `Template #${rowToArchive.templateno} - ${rowToArchive.route}`, // Customized
                dateArchived: new Date().toISOString(),
                originalStatus: rowToArchive.status,
                originalData: rowToArchive
            };
            
            archiveList.push(archiveItem);
            localStorage.setItem("ibt_archive", JSON.stringify(archiveList));

        } catch (e) {
            console.error("Failed to add to archive:", e);
            return;
        }

        const nextActiveList = records.filter((r) => r.id !== rowToArchive.id);
        persist(nextActiveList);
        
        console.log("Item archived successfully!");
    };


    const filtered = records.filter((bus) => {
        const matchesSearch =
            bus.templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                        <button onClick={() => setShowPreview(true)} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                            + Add New
                        </button>
                        {role === "superadmin" && (
                            <button onClick={() => setShowNotify(true)} className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all w-full sm:w-auto">
                                Notify
                            </button>
                        )}
                        
                        {role === "bus" && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                                >
                                Submit Report
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
                <Table
                    columns={["Template No", "Route", "Time", "Date", "Company", "Status"]}
                    data={paginatedData.map((bus) => ({
                        id: bus.id,
                        templateno: bus.templateNo,
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
                            <button
                                onClick={() => handleArchive(row)}
                                title="Archive"
                                className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
                            >
                                <Archive size={16} />
                            </button>
                            
                            <button
                                onClick={() => setDeleteRow(row)}
                                title="Delete"
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
                    totalItems={filtered.length}
                    onItemsPerPageChange={(newItemsPerPage) => {
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1);
                    }}
                />
            </div>

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

            {editRow && (
                <EditBusTrip
                    row={editRow}
                    onClose={() => setEditRow(null)}
                    onSave={(updated) => {
                        const next = records.map((r) => (r.id === updated.id ? updated : r));
                        persist(next);
                        setEditRow(null);
                    }}
                />
            )}

            {deleteRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
                        <h3 className="text-base font-semibold text-slate-800">Archive Bus Trip</h3>
                        <p className="mt-2 text-sm text-slate-600">Are you sure you want to archive template {deleteRow.templateno}?</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                            <button onClick={() => { 
                                handleArchive(deleteRow); 
                                setDeleteRow(null); 
                            }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700">Archive</button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteModal
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to remove this bus record? This action cannot be undone."
                itemName={deleteRow ? `Template No - #${deleteRow.templateno} - ${deleteRow.route} - ${deleteRow.company}` : ""}
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