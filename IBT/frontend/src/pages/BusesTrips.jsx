import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditBusTrip from "../components/busTrips/EditBusTrip";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
import StatCardGroupBus from "../components/busTrips/StatCardGroupBus";
import { submitPageReport } from "../utils/reportService.js";
import { sendNotification } from "../utils/notificationService.js";
import { logActivity } from "../utils/logger";
import {
  Archive,
  Trash2,
  LogOut,
  CheckCircle,
  FileText,
  Loader2,
  History,
  ListChecks,
  X,
  Bus,
  Plus,
  Settings,
} from "lucide-react";

// --- NEW COMPONENT: Manage Companies & Buses Modal ---
const ManageCompaniesModal = ({
  isOpen,
  onClose,
  companyData,
  fetchCompanies,
  role,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // Bus Form State
  const [newBusPlate, setNewBusPlate] = useState("");
  const [newBusRoute, setNewBusRoute] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = "http://localhost:3000/api/companies";

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCompanyId(null);
      setIsEditingCompany(false);
      setNewCompanyName("");
      setNewBusPlate("");
      setNewBusRoute("");
    }
  }, [isOpen]);

  const activeCompany = companyData.find((c) => c._id === selectedCompanyId);

  // 1. Company Actions
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName }),
      });
      if (res.ok) {
        await fetchCompanies();
        setNewCompanyName("");
        setIsEditingCompany(false);
      } else {
        alert("Failed to create company");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Delete this company and all its buses?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCompanies();
        if (selectedCompanyId === id) setSelectedCompanyId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Bus Actions (Uses PUT to update the company document)
  const handleAddBus = async () => {
    if (!newBusPlate.trim() || !newBusRoute.trim() || !activeCompany) return;

    const updatedBuses = [
      ...activeCompany.buses,
      { plateNumber: newBusPlate, route: newBusRoute },
    ];

    try {
      const res = await fetch(`${API_URL}/${activeCompany._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activeCompany, buses: updatedBuses }),
      });

      if (res.ok) {
        await fetchCompanies();
        setNewBusPlate("");
        setNewBusRoute("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBus = async (plateNumber) => {
    if (!activeCompany) return;
    if (!window.confirm(`Remove bus ${plateNumber}?`)) return;

    const updatedBuses = activeCompany.buses.filter(
      (b) => b.plateNumber !== plateNumber,
    );

    try {
      const res = await fetch(`${API_URL}/${activeCompany._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activeCompany, buses: updatedBuses }),
      });

      if (res.ok) {
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[600px] flex rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* LEFT SIDE: Company List */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-700">Companies</h3>
            <button
              onClick={() => setIsEditingCompany(true)}
              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
            >
              <Plus size={18} />
            </button>
          </div>

          {isEditingCompany && (
            <div className="p-3 bg-white border-b border-slate-100 animate-in slide-in-from-top-2">
              <input
                autoFocus
                type="text"
                placeholder="Company Name"
                className="w-full p-2 text-sm border rounded-lg mb-2 outline-none focus:border-emerald-500"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCompany}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingCompany(false)}
                  className="flex-1 bg-slate-200 text-slate-600 text-xs py-1.5 rounded-md hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {companyData.map((company) => (
              <div
                key={company._id}
                onClick={() => setSelectedCompanyId(company._id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedCompanyId === company._id
                    ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500"
                    : "bg-white border-slate-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${selectedCompanyId === company._id ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Bus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800">
                      {company.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {company.buses?.length || 0} buses
                    </span>
                  </div>
                </div>
                {role === "superadmin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCompany(company._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Bus Management */}
        <div className="w-2/3 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              {activeCompany
                ? `Manage ${activeCompany.name} Buses`
                : "Select a Company"}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          {activeCompany ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Add Bus Form */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DIN-123"
                    className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={newBusPlate}
                    onChange={(e) => setNewBusPlate(e.target.value)}
                  />
                </div>
                <div className="col-span-6">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Default Route
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surigao - Butuan"
                    className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={newBusRoute}
                    onChange={(e) => setNewBusRoute(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <button
                    onClick={handleAddBus}
                    className="w-full h-[38px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Bus List */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeCompany.buses && activeCompany.buses.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Plate No.</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCompany.buses.map((bus, idx) => (
                        <tr
                          key={`${bus.plateNumber}-${idx}`}
                          className="hover:bg-slate-50 group"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {bus.plateNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {bus.route}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteBus(bus.plateNumber)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Bus size={48} className="mb-2 opacity-20" />
                    <p>No buses added yet for {activeCompany.name}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="bg-slate-100 p-4 rounded-full mb-3">
                <Bus size={32} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-600">
                Select a company to manage buses
              </p>
              <p className="text-sm">
                Click on a company from the list on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const BusTrips = () => {
  // 1. STATE MANAGEMENT
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companyData, setCompanyData] = useState([]); // NOW REAL DATA

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showManageCompaniesModal, setShowManageCompaniesModal] =
    useState(false);

  // Action States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [deleteRow, setDeleteRow] = useState(null);
  const [logoutRow, setLogoutRow] = useState(null);
  const [ticketRefInput, setTicketRefInput] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const role = localStorage.getItem("authRole") || "bus";
  const API_URL = "http://localhost:3000/api/bustrips";
  const COMPANY_API_URL = "http://localhost:3000/api/companies";

  const [defaultPrice, setDefaultPrice] = useState(75);

  useEffect(() => {
    const saved = localStorage.getItem("defaultBusPrice");
    if (saved) setDefaultPrice(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("defaultBusPrice", defaultPrice);
  }, [defaultPrice]);

  //Set Modal States
  const [showSetPriceModal, setShowSetPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [isSettingPrice, setIsSettingPrice] = useState(false);

  const handleSetPrice = async () => {
    if (!newPrice || isNaN(newPrice)) {
      alert("Please enter a valid price.");
      return;
    }

    setIsSettingPrice(true);

    try {
      setDefaultPrice(Number(newPrice));

      await logActivity(
        role,
        "SET_DEFAULT_PRICE",
        `Set default bus fee to ₱${newPrice}`,
        "BusTrips",
      );

      setShowSetPriceModal(false);
      setNewPrice("");
    } catch (err) {
      console.error(err);
      alert("Failed to set price");
    } finally {
      setIsSettingPrice(false);
    }
  };

  // --- NEW: ADD BUS FORM STATE ---
  const [newBusData, setNewBusData] = useState({
    templateNo: "",
    route: "",
    company: "",
    time: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
    price: 75,
  });

  // 2. DATA FETCHING
  const fetchBusTrips = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const formattedData = data.map((item) => ({
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

  const fetchCompanies = async () => {
    try {
      const res = await fetch(COMPANY_API_URL);
      if (res.ok) {
        const data = await res.json();
        setCompanyData(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchBusTrips();
    fetchCompanies();
  }, []);

  // 3. COMPUTED VALUES
  const availableCompanies = companyData.map((c) => c.name);

  const filtered = records.filter((bus) => {
    const templateNo = bus.templateNo || bus.templateno || "";
    const matchesSearch =
      templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;
    const matchesDate =
      !selectedDate ||
      new Date(bus.date).toDateString() ===
        new Date(selectedDate).toDateString();
    return matchesSearch && matchesCompany && matchesDate;
  });

  const totalTrips = filtered.length;
  const paidTrips = filtered.filter((t) => t.status === "Paid").length;
  const pendingTrips = filtered.filter((t) => t.status === "Pending").length;
  const totalRevenue = filtered
    .filter((t) => t.status === "Paid")
    .reduce((sum, t) => sum + (Number(t.price) || 75), 0);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // --- HANDLERS ---

  // Updated: Open Add Modal
  const handleAddClick = () => {
    setNewBusData({
      templateNo: "",
      route: "",
      company: "",
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
      price: defaultPrice, // ✅ snapshot price
    });

    setShowAddModal(true);
  };

  // Updated: Handle Company Selection in Add Form
  const handleAddFormCompanyChange = (e) => {
    const selectedCompName = e.target.value;
    setNewBusData((prev) => ({
      ...prev,
      company: selectedCompName,
      templateNo: "", // Reset plate number
      route: "", // Reset route
    }));
  };

  // Updated: Handle Plate Selection in Add Form
  const handleAddFormPlateChange = (e) => {
    const plate = e.target.value;

    // Find the selected company object
    const selectedCompObj = companyData.find(
      (c) => c.name === newBusData.company,
    );

    // Find the specific bus to get the route
    const selectedBus = selectedCompObj?.buses.find(
      (b) => b.plateNumber === plate,
    );

    setNewBusData((prev) => ({
      ...prev,
      templateNo: plate,
      route: selectedBus ? selectedBus.route : "", // Auto-fill route
    }));
  };

  // Updated: Create Record
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBusData),
      });
      if (response.ok) {
        const newItem = await response.json();
        await logActivity(
          role,
          "CREATE_TRIP",
          `Created Trip ${newItem.templateNo} - ${newItem.route}`,
          "BusTrips",
        );
        fetchBusTrips();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error creating:", error);
    }
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
    if (filtered.length === 0) return alert("No records to export.");
    const dataToExport = filtered.map((item) => ({
      "Plate No": item.templateNo || item.templateno || "-",
      "Ticket Ref": item.ticketReferenceNo || "-",
      Route: item.route || "-",
      Price: `₱${(item.price || 75).toFixed(2)}`,
      Time: item.time,
      Departure: item.departureTime || "",
      Date: item.date ? new Date(item.date).toLocaleDateString() : "-",
      Company: item.company || "-",
      Status: item.status || "-",
    }));
    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport
      .map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([headers + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bus_Trips_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // --- EXPORT TO PDF ---
  const handleExportPDF = () => {
    if (filtered.length === 0) return alert("No records to export.");
    const doc = new jsPDF("landscape", "mm", "a4");
    doc.text("Bus Trips Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [
        [
          "Plate No",
          "Ticket Ref",
          "Route",
          "Price",
          "Time",
          "Departure",
          "Date",
          "Company",
          "Status",
        ],
      ],
      body: filtered.map((item) => [
        item.templateNo || "-",
        item.ticketReferenceNo || "-",
        item.route || "-",
        `₱${(item.price || 75).toFixed(2)}`,
        item.time,
        item.departureTime || "",
        item.date ? new Date(item.date).toLocaleDateString() : "-",
        item.company || "-",
        item.status || "-",
      ]),
    });
    doc.save(`Bus_Trips_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_URL}/${id}`, { method: "DELETE" }),
        ),
      );
      await logActivity(
        role,
        "BULK_DELETE",
        `Deleted ${selectedIds.length} items`,
        "BusTrips",
      );
      await fetchBusTrips();
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUBMIT REPORT ---
  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      const reportPayload = {
        screen: "Bus Trips Management",
        generatedDate: new Date().toLocaleString(),
        data: filtered,
      };
      await submitPageReport(
        "Bus Trips",
        reportPayload,
        localStorage.getItem("authName") || "Admin",
      );
      await Promise.all(
        filtered.map((item) =>
          fetch(`${API_URL}/${item.id}`, { method: "DELETE" }),
        ),
      );
      setShowSubmitModal(false);
      fetchBusTrips();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReporting(false);
    }
  };

  const formatTime = (t) => t; // Simplified
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(paginatedData.map((i) => i.id));
    else setSelectedIds([]);
  };
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleLogoutClick = (row) => {
    setLogoutRow(row);
    setTicketRefInput("");
  };

  // --- UPDATED CONFIRM LOGOUT (DEPART) FUNCTION ---
  const confirmLogout = async () => {
    if (!logoutRow || !ticketRefInput) return;

    // CHECK FOR UNIQUE TICKET REF
    const isDuplicate = records.some(
      (record) =>
        record.ticketReferenceNo &&
        record.ticketReferenceNo.toString().trim() ===
          ticketRefInput.toString().trim(),
    );

    if (isDuplicate) {
      alert(
        `Error: Ticket Reference Number "${ticketRefInput}" already exists. Please use a unique number.`,
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${logoutRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketReferenceNo: ticketRefInput,
          status: "Paid",
          departureTime: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      });
      if (response.ok) {
        fetchBusTrips();
        setLogoutRow(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
    fetchBusTrips();
    setDeleteRow(null);
  };

  const handleArchive = (row) => setArchiveRow(row);
  const confirmArchive = async () => {
    if (!archiveRow) return;
    try {
      // 1. Send to Archives
      const archiveRes = await fetch("http://localhost:3000/api/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Bus Trip",
          description: `Trip: ${archiveRow.templateNo}`,
          originalData: archiveRow,
          archivedBy: role,
        }),
      });

      // 2. If Archive successful, Delete and Log
      if (archiveRes.ok) {
        await fetch(`${API_URL}/${archiveRow.id}`, { method: "DELETE" });

        // --- NEW: CREATE LOG ENTRY ---
        await logActivity(
          role,
          "ARCHIVE_TRIP",
          `Archived Bus: ${archiveRow.templateNo} - ${archiveRow.route}`,
          "BusTrips",
        );
        // -----------------------------

        fetchBusTrips();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setArchiveRow(null);
    }
  };

  // --- TABLE COLUMNS ---
  const tableColumns = isSelectionMode
    ? [
        <div key="header-check" className="flex items-center">
          <input
            type="checkbox"
            checked={
              selectedIds.length === paginatedData.length &&
              paginatedData.length > 0
            }
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>,
        "Plate No",
        "Ticket Ref",
        "Route",
        "Price",
        "Time",
        "Departure",
        "Date",
        "Company",
        "Status",
      ]
    : [
        "Plate No",
        "Ticket Ref",
        "Route",
        "Price",
        "Time",
        "Departure",
        "Date",
        "Company",
        "Status",
      ];

  return (
    <Layout title="Bus Trips Management">
      {/* Analytics */}
      <div className="mb-6">
        <StatCardGroupBus
          totalTrips={totalTrips}
          paidTrips={paidTrips}
          pendingTrips={pendingTrips}
          totalRevenue={totalRevenue}
        />
      </div>

      <div className="px-4 lg:px-8">
        <div className="flex flex-col gap-4 w-full">
          {/* Filters */}
          <BusTripFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            uniqueCompanies={availableCompanies}
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-2">
            {/* Bulk Delete UI */}
            {isSelectionMode && selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 px-2">
                  {selectedIds.length} Selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 shadow-sm border"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}

            <div
              className={`flex flex-wrap items-center justify-end gap-3 ${isSelectionMode ? "ml-auto" : "w-full"}`}
            >
              {/* BUS ADMIN: SUBMIT REPORT BUTTON */}
              {role === "bus" && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <FileText size={18} />
                  <span>Submit Report</span>
                </button>
              )}
              {/* SUPER ADMIN: SET PRICE BUTTON */}
              {role === "superadmin" && (
                <button
                  onClick={() => setShowSetPriceModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Settings size={18} /> <span>Set Price</span>
                </button>
              )}

              {/* SUPER ADMIN: MANAGE COMPANIES BUTTON */}
              {role === "superadmin" && (
                <button
                  onClick={() => setShowManageCompaniesModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Bus size={18} />
                  <span>Manage Companies</span>
                </button>
              )}

              {/* BUS ADMIN: ADD BUS BUTTON */}
              <button
                onClick={handleAddClick}
                className="flex items-center cursor-pointer justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>+ Add Bus</span>
              </button>

              <ExportMenu
                title="Download Options"
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />

              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 transition-all cursor-pointer"
              >
                <History size={18} />
                <span className="hidden sm:inline">Logs</span>
              </button>

              {/* SELECTION TOGGLE */}
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${isSelectionMode ? "bg-red-500 text-white" : "bg-white border-slate-200 text-slate-500"}`}
              >
                {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={paginatedData.map((bus) => {
              const rowData = {
                id: bus.id,
                plateno: bus.templateNo || bus.templateno || "-",
                route: bus.route,
                price: `₱${(bus.price || 75).toFixed(2)}`,
                time: formatTime(bus.time),
                departure: formatTime(bus.departureTime),
                date: bus.date ? new Date(bus.date).toLocaleDateString() : "",
                company: bus.company,
                status: bus.status,
                ticketref: bus.ticketReferenceNo || "-",
              };
              if (isSelectionMode) {
                return {
                  select: (
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(bus.id)}
                        onChange={() => toggleSelect(bus.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                  ),
                  ...rowData,
                };
              }
              return rowData;
            })}
            actions={(row) => (
              <div className="flex justify-end items-center space-x-2">
                {row.status === "Pending" && (
                  <button
                    onClick={() => handleLogoutClick(row)}
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1 px-2"
                  >
                    <LogOut size={16} />
                    <span className="text-xs">Depart</span>
                  </button>
                )}
                <button
                  onClick={() =>
                    handleArchive(records.find((r) => r.id === row.id))
                  }
                  className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                >
                  <Archive size={16} />
                </button>
                {role === "superadmin" && (
                  <button
                    onClick={() =>
                      setDeleteRow(records.find((r) => r.id === row.id))
                    }
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
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

      {/* --- NEW MODAL: Manage Companies --- */}
      <ManageCompaniesModal
        isOpen={showManageCompaniesModal}
        onClose={() => setShowManageCompaniesModal(false)}
        companyData={companyData}
        fetchCompanies={fetchCompanies}
        role={role}
      />

      {/* --- MODAL: Set Price Modal --- */}
      {showSetPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              Set Bus Fee
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Current Price:{" "}
              <span className="font-semibold text-slate-800">
                ₱{defaultPrice}
              </span>
            </p>

            <p className="text-sm text-slate-500 mb-4">
              Enter the new bus fee below. Only numbers are allowed.
            </p>

            <input
              type="text"
              placeholder="Enter new price (e.g. 75)"
              value={newPrice} // <-- ONLY use newPrice
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setNewPrice(value);
              }}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSetPriceModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSetPrice}
                disabled={isSettingPrice}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-70 transition"
              >
                {isSettingPrice ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED MODAL: Add Bus Trip --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Add New Bus Trip
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord}>
              <div className="space-y-4">
                {/* 1. Company Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <select
                    required
                    value={newBusData.company}
                    onChange={handleAddFormCompanyChange}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="">Select Company</option>
                    {companyData.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Plate Number Selection (Filtered) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bus Plate Number
                  </label>
                  <select
                    required
                    value={newBusData.templateNo}
                    onChange={handleAddFormPlateChange}
                    disabled={!newBusData.company}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Select Plate Number</option>
                    {newBusData.company &&
                      companyData
                        .find((c) => c.name === newBusData.company)
                        ?.buses.map((bus) => (
                          <option key={bus.plateNumber} value={bus.plateNumber}>
                            {bus.plateNumber}
                          </option>
                        ))}
                  </select>
                  {!newBusData.company && (
                    <p className="text-xs text-slate-400 mt-1">
                      Select a company first
                    </p>
                  )}
                </div>

                {/* 3. Auto-filled Route */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Route
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newBusData.route}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 font-medium cursor-not-allowed pl-9"
                      placeholder="Auto-filled based on Plate No."
                    />
                    <div className="absolute left-3 top-2.5 text-slate-400">
                      <Bus size={16} />
                    </div>
                  </div>
                </div>

                {/* 4. Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Arrival Time
                    </label>
                    <input
                      type="time"
                      value={newBusData.time}
                      onChange={(e) =>
                        setNewBusData({ ...newBusData, time: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newBusData.date}
                      onChange={(e) =>
                        setNewBusData({ ...newBusData, date: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                    />
                  </div>
                </div>

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
                  Create Bus Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- OTHER EXISTING MODALS --- */}
      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      {logoutRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all">
            <div className="mb-4 flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-full">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Confirm Departure
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              You are about to log out bus{" "}
              <strong>{logoutRow.templateno}</strong> ({logoutRow.company}).
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ticket Reference No.
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Enter reference number..."
                value={ticketRefInput}
                onChange={(e) => setTicketRefInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
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
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${ticketRefInput ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-300 cursor-not-allowed"}`}
              >
                Confirm Departure
              </button>
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
        itemName={deleteRow ? `Plate No: ${deleteRow.templateno}` : ""}
      />

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md cursor-pointer rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to capture and submit the current bus trips
              report?{" "}
              <span className="text-red-500 font-semibold text-xs">
                Note: This will clear the current table.
              </span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isReporting}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
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

      {archiveRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setArchiveRow(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white px-8 py-7 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Archive size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Confirm Archiving
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                Move{" "}
                <span className="font-semibold">{archiveRow.templateNo}</span>{" "}
                to Archives?
              </p>
              <div className="mt-6 flex w-full justify-center gap-3">
                <button
                  onClick={() => setArchiveRow(null)}
                  className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  className="w-32 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-500"
                >
                  Yes, Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BusTrips;
