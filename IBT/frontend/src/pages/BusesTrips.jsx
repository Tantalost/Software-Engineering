import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import EditBusTrip from "../components/busTrips/EditBusTrip.jsx";
import DailyTripsDashboard from "../components/busTrips/DailyTripsDashboard.jsx";
import Pagination from "../components/common/Pagination";
import CommonBusesView from "../components/busTrips/CommonBusesView.jsx";

import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
import StatCardGroupBus from "../components/busTrips/StatCardGroupBus";
import { submitPageReport } from "../utils/reportService.js";
import TableActions from "../components/common/TableActions";
import ViewModal from "../components/common/ViewModal";
import { logActivity } from "../utils/logger";
import NotificationToast from "../components/common/NotificationToast";
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
  TrendingUp
} from "lucide-react";

const addImageToWorksheet = async (workbook, worksheet, imageSrc, range) => {
  if (!imageSrc) return;
  try {
    const response = await fetch(imageSrc);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const imageId = workbook.addImage({
      buffer: arrayBuffer,
      extension: "png",
    });

    const [start, end] = range.split(":");
    const startCol = start.charCodeAt(0) - 65;
    const startRow = parseInt(start.slice(1)) - 1;
    const endCol = end.charCodeAt(0) - 65;
    const endRow = parseInt(end.slice(1)) - 1;

    worksheet.addImage(imageId, {
      tl: { col: startCol, row: startRow },
      br: { col: endCol, row: endRow },
    });
  } catch (error) {
    console.error("Branding image error:", error);
  }
};

const ManageCompaniesModal = ({
  isOpen,
  onClose,
  companyData,
  fetchCompanies,
  role,
  setNotificationState,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [newBusPlate, setNewBusPlate] = useState("");
  const [newBusFrom, setNewBusFrom] = useState("");
  const [newBusTo, setNewBusTo] = useState("");
  const [tableBusTypeFilter, setTableBusTypeFilter] = useState("All");

  const [isProcessing, setIsProcessing] = useState(false);
  const [editCompanyTarget, setEditCompanyTarget] = useState(null);
  const [editBusTarget, setEditBusTarget] = useState(null);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState(null);
  const [deleteBusTarget, setDeleteBusTarget] = useState(null);

  const [newBusType, setNewBusType] = useState("Regular");

  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/companies`;

  const activeCompany = companyData.find((c) => c._id === selectedCompanyId);

  const resetForms = () => {
    setIsEditingCompany(false);
    setEditCompanyTarget(null);
    setNewCompanyName("");
    setNewBusPlate("");
    setNewBusFrom("");
    setNewBusTo("");
    setNewBusType("Regular");
    setEditBusTarget(null);
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedCompanyId(null);
      resetForms();
    }
  }, [isOpen]);

  const confirmDeleteCompany = async () => {
    if (!deleteCompanyTarget) return;

    try {
      const res = await fetch(`${API_URL}/${deleteCompanyTarget._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchCompanies();

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Company "${deleteCompanyTarget.name}" deleted successfully!`,
          autoClose: true,
          duration: 3000,
        });

        if (selectedCompanyId === deleteCompanyTarget._id) {
          setSelectedCompanyId(null);
        }
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to delete company",
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error deleting company",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setDeleteCompanyTarget(null);
    }
  };

  const confirmDeleteBus = async () => {
    if (!deleteBusTarget || !activeCompany) return;

    const updatedBuses = activeCompany.buses.filter(
      (b) => b.plateNumber !== deleteBusTarget.plateNumber,
    );

    try {
      const res = await fetch(`${API_URL}/${activeCompany._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activeCompany, buses: updatedBuses }),
      });

      if (res.ok) {
        await fetchCompanies();

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Bus ${deleteBusTarget.plateNumber} removed successfully!`,
          autoClose: true,
          duration: 3000,
        });
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to remove bus",
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error removing bus",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setDeleteBusTarget(null);
    }
  };

  const handleSaveCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsProcessing(true);

    const method = editCompanyTarget ? "PUT" : "POST";
    const url = editCompanyTarget
      ? `${API_URL}/${editCompanyTarget._id}`
      : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName }),
      });
      if (res.ok) {
        await fetchCompanies();
        setNewCompanyName("");
        setIsEditingCompany(false);
        setEditCompanyTarget(null);

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Company "${newCompanyName}" ${editCompanyTarget ? "updated" : "added"} successfully!`,
          autoClose: true,
          duration: 3000,
        });
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: `Failed to ${editCompanyTarget ? "update" : "create"} company`,
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: `Error ${editCompanyTarget ? "updating" : "creating"} company`,
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBus = async () => {
    if (
      !newBusPlate.trim() ||
      !newBusFrom.trim() ||
      !newBusTo.trim() ||
      !activeCompany
    )
      return;

    const routeString = `${newBusFrom} - ${newBusTo}`;

    let updatedBuses;
    if (editBusTarget) {
      updatedBuses = activeCompany.buses.map((b) =>
        b.plateNumber === editBusTarget.plateNumber
          ? {
              plateNumber: newBusPlate,
              route: routeString,
              busType: newBusType,
            }
          : b,
      );
    } else {
      updatedBuses = [
        ...activeCompany.buses,
        { plateNumber: newBusPlate, route: routeString, busType: newBusType },
      ];
    }

    try {
      const res = await fetch(`${API_URL}/${activeCompany._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activeCompany, buses: updatedBuses }),
      });

      if (res.ok) {
        await fetchCompanies();
        resetForms();
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Bus ${editBusTarget ? "updated" : "added"} successfully!`,
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[600px] flex rounded-2xl bg-white shadow-2xl overflow-hidden">
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
                  onClick={handleSaveCompany}
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
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCompanyTarget(company);
                        setNewCompanyName(company.name);
                        setIsEditingCompany(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-500"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCompanyTarget(company);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Type
                    </label>
                    <select
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusType}
                      onChange={(e) => setNewBusType(e.target.value)}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Aircon">Aircon</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      placeholder="ex. Bus-1"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusPlate}
                      onChange={(e) => setNewBusPlate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      From
                    </label>
                    <input
                      type="text"
                      placeholder="ex. Zamboanga"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusFrom}
                      onChange={(e) => setNewBusFrom(e.target.value)}
                    />
                  </div>

                  <div className="col-span-5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      To
                    </label>
                    <input
                      type="text"
                      placeholder="ex. Pagadian"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusTo}
                      onChange={(e) => setNewBusTo(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 flex gap-1">
                    <button
                      onClick={handleSaveBus}
                      className="flex-1 h-[38px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {editBusTarget ? "Save" : "Add"}
                    </button>
                    {editBusTarget && (
                      <button
                        onClick={resetForms}
                        className="h-[38px] px-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                        title="Cancel Edit"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-700">
                  Registered Buses
                </h4>
                <select
                  value={tableBusTypeFilter}
                  onChange={(e) => setTableBusTypeFilter(e.target.value)}
                  className="p-1.5 text-sm border border-slate-300 rounded-lg outline-none bg-slate-50"
                >
                  <option value="All">All Types</option>
                  <option value="Regular">Regular Only</option>
                  <option value="Aircon">Aircon Only</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeCompany.buses && activeCompany.buses.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Bus No.</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCompany.buses
                        .filter(
                          (bus) =>
                            tableBusTypeFilter === "All" ||
                            bus.busType === tableBusTypeFilter,
                        ) // Filter logic
                        .map((bus, idx) => (
                          <tr
                            key={`${bus.plateNumber}-${idx}`}
                            className="hover:bg-slate-50 group"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${bus.busType === "Aircon" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                              >
                                {bus.busType || "Regular"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {bus.plateNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {bus.route}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setEditBusTarget(bus);
                                  setNewBusPlate(bus.plateNumber);
                                  const [fromRoute, toRoute] =
                                    bus.route.split(" - "); // Split it back into two inputs when editing
                                  setNewBusFrom(
                                    fromRoute
                                      ? fromRoute.trim()
                                      : bus.route || "",
                                  );
                                  setNewBusTo(toRoute ? toRoute.trim() : "");
                                  setNewBusType(bus.busType || "Regular");
                                }}
                                className="text-slate-400 hover:text-blue-500 p-1 mr-1 rounded-md"
                              >
                                <Settings size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteBusTarget(bus)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-md"
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
                    <p>No buses added yet.</p>
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

          {deleteCompanyTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full mb-3">
                    <Trash2 size={24} />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800">
                    Delete Company
                  </h3>

                  <p className="text-sm text-slate-600 mt-2">
                    Are you sure you want to delete
                    <span className="font-semibold">
                      {" "}
                      {deleteCompanyTarget.name}
                    </span>
                    ?
                  </p>

                  <p className="text-xs text-red-500 mt-1">
                    All buses under this company will also be removed.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setDeleteCompanyTarget(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmDeleteCompany}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deleteBusTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full mb-3">
                    <Trash2 size={24} />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800">
                    Remove Bus
                  </h3>

                  <p className="text-sm text-slate-600 mt-2">
                    Remove Bus Number
                    <span className="font-semibold">
                      {" "}
                      {deleteBusTarget.plateNumber}
                    </span>
                    ?
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setDeleteBusTarget(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmDeleteBus}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BusTrips = () => {
  const [collectorName, setCollectorName] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const getTodayFormatted = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBusType, setSelectedBusType] = useState("");
  const [companyData, setCompanyData] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showManageCompaniesModal, setShowManageCompaniesModal] = useState(false);
  const [showCommonModal, setShowCommonModal] = useState(false);
  const [shiftInterval, setShiftInterval] = useState(6);
  const [selectedShift, setSelectedShift] = useState("");
  const [isLateSubmit, setIsLateSubmit] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [archiveRow, setArchiveRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [logoutRow, setLogoutRow] = useState(null);
  const [ticketRefInput, setTicketRefInput] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const role = localStorage.getItem("authRole") || "bus";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/bustrips`;
  const COMPANY_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/companies`;

  const [defaultPrice, setDefaultPrice] = useState(75);

  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: "",
    message: "",
    autoClose: true,
    duration: 3000,
  });

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
      const timer = setTimeout(() => {
        setNotificationState({
          isOpen: false,
          type: "",
          message: "",
          autoClose: true,
          duration: 3000,
        });
      }, notificationState.duration);
      return () => clearTimeout(timer);
    }
  }, [
    notificationState.isOpen,
    notificationState.autoClose,
    notificationState.duration,
  ]);

  useEffect(() => {
    const fetchDefaultPrice = async () => {
      try {
        const response = await fetch(`${API_URL}/default-price`);
        if (response.ok) {
          const data = await response.json();
          setDefaultPrice(data.defaultPrice);

          localStorage.setItem("defaultBusPrice", data.defaultPrice.toString());
        }
      } catch (error) {
        console.error("Error fetching default price:", error);

        const saved = localStorage.getItem("defaultBusPrice");
        if (saved) setDefaultPrice(Number(saved));
      }
    };
    fetchDefaultPrice();
  }, []);

  const [showSetPriceModal, setShowSetPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [isSettingPrice, setIsSettingPrice] = useState(false);

  const handleSetPrice = async () => {
    if (!newPrice || isNaN(newPrice)) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter a valid price.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const priceValue = Number(newPrice);
    if (priceValue <= 0) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter a valid price greater than 0.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    setIsSettingPrice(true);

    try {
      const response = await fetch(`${API_URL}/update-prices/all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPrice: priceValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prices in database");
      }

      const result = await response.json();

      setDefaultPrice(priceValue);
      localStorage.setItem("defaultBusPrice", priceValue.toString());

      await fetchBusTrips();

      await logActivity(
        role,
        "SET_DEFAULT_PRICE",
        `Set default bus fee to ₱${newPrice} (Updated ${result.modifiedCount || 0} pending trips)`,
        "BusTrips",
      );

      setShowSetPriceModal(false);
      setNewPrice("");

      setNotificationState({
        isOpen: true,
        type: "success",
        message: `Prices updated to ₱${priceValue}!`,
        autoClose: true,
        duration: 3000,
      });
    } catch (err) {
      console.error(err);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to set price: " + err.message,
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setIsSettingPrice(false);
    }
  };

  const [newBusData, setNewBusData] = useState({
    templateNo: "",
    route: "",
    company: "",
    busType: "",
    time: "",
    date: new Date().toISOString().split("T")[0],
    status: "Scheduled",
    price: 75,
    parkingEstimation: "10 minutes",
    expectedDeparture: "",
  });

  useEffect(() => {
    if (newBusData.time && newBusData.parkingEstimation) {
      const expected = calculateExpectedDeparture(
        newBusData.time,
        newBusData.parkingEstimation,
      );
      if (expected !== newBusData.expectedDeparture) {
        setNewBusData((prev) => ({ ...prev, expectedDeparture: expected }));
      }
    }
  }, [newBusData.time, newBusData.parkingEstimation]);

  useEffect(() => {
    if (editRow && editRow.time && editRow.parkingEstimation) {
      const expected = calculateExpectedDeparture(
        editRow.time,
        editRow.parkingEstimation,
      );
      if (expected !== editRow.expectedDeparture) {
        setEditRow((prev) => ({ ...prev, expectedDeparture: expected }));
      }
    }
  }, [editRow?.time, editRow?.parkingEstimation]);

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

  const availableCompanies = companyData.map((c) => c.name);

  const filtered = records.filter((bus) => {
    const templateNo = bus.templateNo || bus.templateno || "";
    const matchesSearch =
      templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bus.route || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;
    const matchesDate =
      !selectedDate ||
      new Date(bus.date).toDateString() ===
        new Date(selectedDate).toDateString();

    const matchesBusType =
      selectedBusType === "" || bus.busType === selectedBusType;

    return matchesSearch && matchesCompany && matchesDate && matchesBusType;
  });

  const totalTrips = filtered.length;
  const scheduledTrips = filtered.filter(
    (t) => t.status === "Scheduled",
  ).length;
  const pendingTrips = filtered.filter((t) => t.status === "Pending").length;
  const arrivedTrips = filtered.filter((t) => t.status === "Arrived").length;
  const paidTrips = filtered.filter((t) => t.status === "Departed").length;
  const totalRevenue = filtered
    .filter((t) => t.status === "Departed")
    .reduce((sum, t) => sum + (Number(t.price) || 75), 0);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleAddClick = () => {
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNewBusData({
      templateNo: "",
      route: "",
      company: "",
      busType: "",
      time: currentTime,
      date: new Date().toISOString().split("T")[0],
      status: "Scheduled",
      price: defaultPrice,
      parkingEstimation: "10 minutes",
      expectedDeparture: calculateExpectedDeparture(currentTime, "10 minutes"),
    });
    setShowAddModal(true);
  };

  const handleAddFormPlateChange = (e) => {
    const plate = e.target.value;

    const selectedCompObj = companyData.find(
      (c) => c.name === newBusData.company,
    );

    const selectedBus = selectedCompObj?.buses.find(
      (b) => b.plateNumber === plate,
    );

    setNewBusData((prev) => ({
      ...prev,
      templateNo: plate,
      route: selectedBus ? selectedBus.route : "",
    }));
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const tripData = {
        ...newBusData,
        price: newBusData.price || defaultPrice,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
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

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Bus trip ${newItem.templateNo} created successfully!`,
          autoClose: true,
          duration: 3000,
        });
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to create bus trip",
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating:", error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error creating bus trip",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleMarkOnFix = async (tripId) => {
    try {
      const response = await fetch(`${API_URL}/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "On Fix" }),
      });
      if (response.ok) {
        await fetchBusTrips();
        setNotificationState({ isOpen: true, type: "warning", message: "Bus marked as On Fix.", autoClose: true, duration: 3000 });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 2. The One-Click Approve Departure Action
  const handleApproveDeparture = (trip) => {
    setLogoutRow(trip); // Uses your existing modal state
    setTicketRefInput(""); // Clears the input field
  };

  const handleEditSubmit = async (updatedData) => {
    if (updatedData.status === "Paid") {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Paid trips cannot be edited.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${updatedData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        await logActivity(
          role,
          "UPDATE_TRIP",
          `Updated Bus Trip: ${updatedData.templateNo}`,
          "BusTrips",
        );

        fetchBusTrips();
        setEditRow(null);

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Bus trip ${updatedData.templateNo} updated successfully!`,
          autoClose: true,
          duration: 3000,
        });
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to update bus trip.",
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating:", error);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error updating bus trip.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const calculateExpectedDeparture = (arrivalTime, estimationString) => {
    if (!arrivalTime || !estimationString) return "";

    let minutesToAdd = 0;
    if (estimationString === "1 hr") minutesToAdd = 60;
    else minutesToAdd = parseInt(estimationString.split(" ")[0]);

    const [hours, minutes] = arrivalTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0);

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportExcel = async () => {
    if (!collectorName.trim()) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter Collector Name before exporting.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    if (filtered.length === 0) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "No records to export.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bus Parking Report");

      worksheet.getRow(1).height = 35;
      await addImageToWorksheet(workbook, worksheet, headerImg, "A1:H4");

      worksheet.mergeCells("A6:H6");
      const titleCell = worksheet.getCell("A6");
      titleCell.value = "BUS PARKING REPORTS";
      titleCell.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
      titleCell.alignment = { horizontal: "center" };

      worksheet.addRow([]);
      worksheet.addRow([
        `Date: ${new Date().toLocaleDateString()}`,
        "",
        "",
        "",
        "",
        "",
        "",
        `No. of Bus: ${filtered.length}`,
      ]);
      worksheet.addRow([
        `Operator: ${localStorage.getItem("authName") || "Admin"}`,
        "",
        "",
        "",
        "",
        "",
        "",
        `Total Revenue: Php ${totalRevenue.toFixed(2)}`,
      ]);

      worksheet.addRow([`Collector: ${collectorName || "-"}`]);

      const headerRow = worksheet.addRow([
        "Bus No.",
        "Type",
        "Ticket Ref.",
        "Route",
        "Price",
        "Arrival",
        "Departure",
        "Company",
        "Status",
      ]);

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF10B981" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      filtered.forEach((item) => {
        worksheet.addRow([
          item.templateNo || item.templateno || "-",
          item.busType || "Regular",
          item.ticketReferenceNo || "-",
          item.route || "-",
          `Php ${(item.price || 75).toFixed(2)}`,
          item.time || "-",
          item.departureTime || "-",
          item.company || "-",
          item.status || "-",
        ]);
      });

      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5;
      await addImageToWorksheet(
        workbook,
        worksheet,
        footerImg,
        `A${lastRowNumber}:H${lastRowNumber + 3}`,
      );

      worksheet.columns = [
        { width: 15 },
        { width: 18 },
        { width: 25 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 20 },
        { width: 15 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `IBT_Bus_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      logActivity(
        role,
        "EXPORT_EXCEL",
        `Exported branded report for ${filtered.length} bus trips`,
        "BusTrips",
      );
    } catch (err) {
      console.error("Bus Trips ExcelJS Export Failed:", err);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to export Excel. Please try again.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleExportPDF = () => {
    if (!collectorName.trim()) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter Collector Name before exporting.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    if (filtered.length === 0) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "No records to export.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header Image
    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BUS PARKING REPORTS", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 55);
    doc.text(
      `Operator: ${localStorage.getItem("authName") || "Admin"}`,
      margin,
      61,
    );

    doc.text(`Collector: ${collectorName || "-"}`, margin, 67);

    doc.text(`No. of Bus: ${filtered.length}`, pageWidth - margin, 55, {
      align: "right",
    });
    doc.text(
      `Revenue: Php ${totalRevenue.toFixed(2)}`,
      pageWidth - margin,
      61,
      { align: "right" },
    );

    autoTable(doc, {
      startY: 70,
      margin: { left: margin, right: margin, bottom: 35 },
      head: [
        [
          "Plate No.",
          "Type",
          "Ticket Ref.",
          "Route",
          "Price",
          "Arrival",
          "Departure",
          "Company",
          "Status",
        ],
      ],
      body: filtered.map((item) => [
        item.templateNo || "-",
        item.busType || "Regular",
        item.ticketReferenceNo || "-",
        item.route || "-",
        `Php ${(item.price || 75).toFixed(2)}`,
        item.time || "-",
        item.departureTime || "-",
        item.company || "-",
        item.status || "-",
      ]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 },
      didDrawPage: (data) => {
        doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
      },
    });

    doc.save(
      `IBT_Bus_Parking_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setNotificationState({
        isOpen: true,
        type: "warning",
        message: "Please select at least one record.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    const GLOBAL_API_URL = `${
      import.meta.env.VITE_API_URL || "http://localhost:10000"
    }/api`;

    try {
      if (role === "bus") {
        const requestPromises = selectedIds.map(async (id) => {
          const item = records.find((r) => r.id === id);
          if (!item) return;

          return fetch(`${GLOBAL_API_URL}/deletion-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: "Bus Trip",
              itemDescription: `Plate No: ${
                item.templateNo || item.templateno
              } - ${item.company}`,
              requestedBy: localStorage.getItem("authName") || "Bus Admin",
              originalData: item,
              reason: "Bulk deletion request",
            }),
          });
        });

        await Promise.all(requestPromises);

        await logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${selectedIds.length} bus trips`,
          "BusTrips",
        );

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Sent deletion requests for ${selectedIds.length} records.`,
          autoClose: true,
          duration: 3000,
        });
      } else {
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

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Successfully deleted ${selectedIds.length} records!`,
          autoClose: true,
          duration: 3000,
        });
      }

      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (e) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to process some records.",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    // 1. NEW VALIDATION: Ensure Collector Name is filled out
    if (!collectorName.trim()) {
      setNotificationState({
        isOpen: true,
        type: "warning",
        message: "Please enter the Name of Collector before submitting.",
        autoClose: true,
        duration: 3000,
      });
      setShowSubmitModal(false); // Close modal so they can type the name
      return;
    }

    setIsReporting(true);
    try {
      const reportPayload = {
        screen: "Bus Trips Management",
        generatedDate: new Date().toLocaleString(),
        shift: selectedShift,
        submittedLate: isLateSubmit,
        collectorName: collectorName.trim(), // 2. NEW: Attach the Collector Name here
        data: filtered, // Submits ALL data (Scheduled, Departed, On Fix)
      };
      
      await submitPageReport(
        "Bus Trips",
        reportPayload,
        localStorage.getItem("authName") ||
          localStorage.getItem("authEmail") ||
          "Admin",
      );
      
      setShowSubmitModal(false);
      setCollectorName(""); 
      
      setNotificationState({ 
        isOpen: true, 
        type: "success", 
        message: "Shift Handoff Report Submitted!", 
        autoClose: true, 
        duration: 3000 
      });
      
    } catch (e) {
      console.error(e);
      setNotificationState({ 
        isOpen: true, 
        type: "error", 
        message: "Failed to submit report.", 
        autoClose: true, 
        duration: 3000 
      });
    } finally {
      setIsReporting(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "-") return "-";
    const [hourString, minute] = timeString.split(":");
    if (!hourString || !minute) return timeString;
    const hour = parseInt(hourString, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

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

  const confirmLogout = async () => {
    if (!ticketRefInput) {
      setNotificationState({
        isOpen: true,
        type: "warning",
        message: "Please enter the ticket reference number.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    // DUPLICATE CHECK: Look through all records to see if this ticket number already exists
    const isDuplicate = records.some(
      (record) =>
        record.ticketReferenceNo &&
        record.ticketReferenceNo.toString().trim() === ticketRefInput.toString().trim()
    );

    if (isDuplicate) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: `Ticket Reference No. "${ticketRefInput}" already exists!`,
        autoClose: true,
        duration: 4000,
      });
      return;
    }

    try {
      const tripId = logoutRow.id || logoutRow._id;
      const response = await fetch(`${API_URL}/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketReferenceNo: ticketRefInput,
          status: "Departed", // <--- Updated to use "Departed" instead of "Paid"
          departureTime: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      });

      if (response.ok) {
        await fetchBusTrips();
        setLogoutRow(null);
        setTicketRefInput("");

        setNotificationState({
          isOpen: true,
          type: "success",
          message: "Bus departure confirmed successfully.",
          autoClose: true,
          duration: 3000,
        });
        
        await logActivity(role, "APPROVE_DEPARTURE", `Approved departure for trip ${tripId} with ticket ${ticketRefInput}`, "BusTrips");
      } else {
        setNotificationState({ isOpen: true, type: "error", message: "Failed to confirm departure.", autoClose: true, duration: 3000 });
      }
    } catch (error) {
      setNotificationState({ isOpen: true, type: "error", message: "Error confirming departure.", autoClose: true, duration: 3000 });
    }
  };

  const handleMarkArrived = async (row) => {
    try {
      const fullRecord = records.find((r) => r.id === row.id) || row;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const actualArrivalTime = `${currentHours}:${currentMinutes}`;

      const estimationStr = fullRecord.parkingEstimation || "10 minutes";
      let minutesToAdd = 10;
      if (estimationStr === "1 hr") {
        minutesToAdd = 60;
      } else {
        minutesToAdd = parseInt(estimationStr.replace(/[^0-9]/g, "")) || 10;
      }

      const departureDate = new Date(now.getTime());
      departureDate.setMinutes(departureDate.getMinutes() + minutesToAdd);

      const expHours = String(departureDate.getHours()).padStart(2, "0");
      const expMinutes = String(departureDate.getMinutes()).padStart(2, "0");
      const newExpectedDeparture = `${expHours}:${expMinutes}`;

      const response = await fetch(`${API_URL}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Arrived",
          time: actualArrivalTime,
          expectedDeparture: newExpectedDeparture,
        }),
      });

      if (response.ok) {
        fetchBusTrips();
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Arrived! Expected Departure updated to ${newExpectedDeparture}.`,
          autoClose: true,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      fetchBusTrips();
      setDeleteRow(null);

      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Record successfully deleted!",
        autoClose: true,
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to delete record.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleArchive = (row) => setArchiveRow(row);
  const confirmArchive = async () => {
    if (!archiveRow) return;
    try {
      const archiveRes = await fetch(`${API_URL}/${archiveRow.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (archiveRes.ok) {
        await logActivity(
          role,
          "ARCHIVE_TRIP",
          `Archived Bus: ${archiveRow.templateNo} - ${archiveRow.route}`,
          "BusTrips",
        );

        fetchBusTrips();

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Bus ${archiveRow.templateNo} archived successfully!`,
          autoClose: true,
          duration: 3000,
        });
      } else {
        console.error("Failed to archive bus trip");
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to archive bus trip",
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (e) {
      console.error("Error archiving:", e);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error archiving bus trip",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setArchiveRow(null);
    }
  };

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
        "Bus No",
        "Type",
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
        "Bus No",
        "Type",
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
      <div className="mb-6">
        <StatCardGroupBus
          totalTrips={totalTrips}
          scheduledTrips={scheduledTrips}
          pendingTrips={pendingTrips}
          arrivedTrips={arrivedTrips}
          paidTrips={paidTrips}
          totalRevenue={totalRevenue}
        />
      </div>

      <div className="px-4 lg:px-8">
        <div className="flex flex-col gap-4 w-full">
          <BusTripFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            uniqueCompanies={availableCompanies}
            selectedBusType={selectedBusType}
            setSelectedBusType={setSelectedBusType}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-2">
            {isSelectionMode && selectedIds.length > 0 && role === "bus" && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 px-2">
                  {selectedIds.length} Selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  title={
                    role === "bus" ? "Request Deletion" : "Delete Selected"
                  }
                  className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 shadow-sm border"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}

            <div
              className={`flex flex-wrap items-center justify-end gap-3 ${isSelectionMode ? "ml-auto" : "w-full"}`}
            >
             <div className="flex items-center gap-3 w-full lg:w-auto mr-auto">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                    Name of Collector:
                  </label>
                  <input
                    type="text"
                    value={collectorName}
                    maxLength={100}
                    onChange={(e) =>
                      setCollectorName(e.target.value.slice(0, 100))
                    }
                    placeholder="Enter collector name"
                    className="w-full sm:w-56 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowCommonModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-emerald-100 transition-all"
                >
                  <TrendingUp size={18} />
                  <span className="hidden sm:inline">Common Buses</span>
                </button>
              </div>

              {role === "bus" && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <FileText size={18} />
                  <span>Submit Report</span>
                </button>
              )}

              {role === "superadmin" && (
                <button
                  onClick={() => {
                    setNewPrice(defaultPrice.toString());
                    setShowSetPriceModal(true);
                  }}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Settings size={18} /> <span>Set Price</span>
                </button>
              )}

              {role === "superadmin" && (
                <button
                  onClick={() => setShowManageCompaniesModal(true)}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Bus size={18} />
                  <span>Manage Companies</span>
                </button>
              )}

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

              {role === "bus" && (
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${isSelectionMode ? "bg-red-500 text-white" : "bg-white border-slate-200 text-slate-500"}`}
                >
                  {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            <DailyTripsDashboard 
              trips={paginatedData} 
              onApproveDeparture={handleApproveDeparture}
              onMarkOnFix={handleMarkOnFix}
            />
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              itemsPerPage={itemsPerPage} 
              totalItems={filtered.length} 
              onItemsPerPageChange={setItemsPerPage} 
            />
          </>
        )}
      </div>

      <ManageCompaniesModal
        isOpen={showManageCompaniesModal}
        onClose={() => setShowManageCompaniesModal(false)}
        companyData={companyData}
        fetchCompanies={fetchCompanies}
        role={role}
      />

      {showSetPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-emerald-600" /> Bus Fee
                Settings
              </h3>
              <button
                onClick={() => setShowSetPriceModal(false)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Set the new standard bus parking rate. Changes take effect upon
              saving.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Global Parking Fee
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      setNewPrice(value);
                    }}
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setShowSetPriceModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPrice}
                disabled={isSettingPrice || !newPrice}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSettingPrice ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <select
                    required
                    value={newBusData.company}
                    onChange={(e) =>
                      setNewBusData((prev) => ({
                        ...prev,
                        company: e.target.value,
                        busType: "",
                        templateNo: "",
                        route: "",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none"
                  >
                    <option value="">Select Company</option>
                    {companyData.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bus Type
                  </label>
                  <select
                    required
                    value={newBusData.busType}
                    onChange={(e) =>
                      setNewBusData((prev) => ({
                        ...prev,
                        busType: e.target.value,
                        templateNo: "",
                        route: "",
                      }))
                    }
                    disabled={!newBusData.company}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none disabled:bg-slate-100"
                  >
                    <option value="">Select Type</option>
                    <option value="Aircon">Aircon</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bus Number
                  </label>
                  <select
                    required
                    value={newBusData.templateNo}
                    onChange={handleAddFormPlateChange}
                    disabled={!newBusData.busType}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none disabled:bg-slate-100"
                  >
                    <option value="">Select Bus Number</option>
                    {newBusData.company &&
                      newBusData.busType &&
                      companyData
                        .find((c) => c.name === newBusData.company)
                        ?.buses.filter(
                          (bus) => bus.busType === newBusData.busType,
                        )
                        .map((bus) => {
                          const isCurrentlyActive = records.some(
                            (r) =>
                              (r.templateNo === bus.plateNumber ||
                                r.templateno === bus.plateNumber) &&
                              r.company === newBusData.company &&
                              r.date?.substring(0, 10) === newBusData.date &&
                              ["Scheduled", "Pending", "Arrived"].includes(
                                r.status,
                              ),
                          );
                          return (
                            <option
                              key={bus.plateNumber}
                              value={bus.plateNumber}
                              disabled={isCurrentlyActive}
                            >
                              {bus.plateNumber}{" "}
                              {isCurrentlyActive ? "(Active Today)" : ""}
                            </option>
                          );
                        })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Route
                  </label>
                  <input
                    type="text"
                    value={newBusData.route}
                    readOnly
                    placeholder="Route will auto-fill..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Parking Est.
                    </label>
                    <select
                      value={newBusData.parkingEstimation}
                      onChange={(e) =>
                        setNewBusData({
                          ...newBusData,
                          parkingEstimation: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 bg-white"
                    >
                      <option value="10 minutes">10 minutes</option>
                      <option value="20 minutes">20 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="40 minutes">40 minutes</option>
                      <option value="50 minutes">50 minutes</option>
                      <option value="1 hr">1 hr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Departure
                    </label>
                    <input
                      type="time"
                      value={newBusData.expectedDeparture}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Status will be set to <strong>Scheduled</strong>
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
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, "");
                  setTicketRefInput(numericValue);
                }}
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
        itemName={deleteRow ? `Plate No: ${deleteRow.templateNo}` : ""}
      />

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">Shift Hand-off Report</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                You are submitting the operational report for your shift. 
                <strong className="text-emerald-600 ml-1">Data will remain on the board</strong> for the next shift to continue.
              </p>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Your Shift ({shiftInterval}-hour intervals):
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                  onChange={(e) => {
                    const shiftStr = e.target.value;
                    setSelectedShift(shiftStr);
                    
                    if (!shiftStr) {
                      setIsLateSubmit(false);
                      return;
                    }

                    // Dynamic Late Check Logic
                    const currentHour = new Date().getHours();
                    const [startHour, endHourStr] = shiftStr.split("-").map(s => parseInt(s));
                    const endHour = endHourStr === 24 ? 0 : endHourStr;
                    
                    let isLate = false;
                    // If current hour is totally outside the shift window
                    if (startHour < endHour) {
                       if (currentHour < startHour || currentHour >= endHour) isLate = true;
                    } else { // Overnight shift (e.g. 18:00 - 00:00)
                       if (currentHour >= endHour && currentHour < startHour) isLate = true;
                    }

                    setIsLateSubmit(isLate);
                  }}
                >
                  <option value="">-- Select Shift --</option>
                  {/* Dynamically generate shift blocks based on the shiftInterval state */}
                  {Array.from({ length: 24 / shiftInterval }).map((_, i) => {
                     const start = i * shiftInterval;
                     const end = start + shiftInterval;
                     const label = `${start.toString().padStart(2, '0')}:00 - ${end === 24 ? '00' : end.toString().padStart(2, '0')}:00`;
                     return <option key={label} value={`${start}-${end}`}>{label}</option>
                  })}
                </select>
                
                {isLateSubmit && selectedShift && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded-md border border-red-100 font-semibold animate-in fade-in">
                    ⚠️ Warning: You are submitting this report outside of your designated {shiftInterval}-hour shift. This will be logged as Submitted Late.
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3">
                <FileText className="text-blue-500 shrink-0" size={20} />
                <div className="text-xs text-blue-800">
                  <strong>Total Records Included:</strong> {filtered.length} Buses<br/>
                  (Includes Scheduled, Departed, and On Fix)
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <strong>Collector:</strong> {collectorName}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting || !selectedShift}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md disabled:opacity-70"
              >
                {isReporting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Confirm Hand-off
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
                Are you sure you want to move{" "}
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
      <NotificationToast
        isOpen={notificationState.isOpen}
        type={notificationState.type}
        message={notificationState.message}
        onClose={() =>
          setNotificationState({
            isOpen: false,
            type: "",
            message: "",
            autoClose: true,
            duration: 3000,
          })
        }
      />

      {viewRow && (
        <ViewModal
          title="View Bus Trip Details"
          fields={[
            {
              label: "Plate No.",
              value: viewRow.templateNo || viewRow.templateno || "-",
            },
            { label: "Company", value: viewRow.company || "-" },
            { label: "Route", value: viewRow.route || "-" },
            { label: "Bus Type", value: viewRow.busType || "Regular" },
            { label: "Status", value: viewRow.status || "-" },
            { label: "Price", value: `₱${(viewRow.price || 75).toFixed(2)}` },

            { label: "Arrival Time", value: formatTime(viewRow.time) },
            { label: "Parking Est.", value: viewRow.parkingEstimation || "-" },
            {
              label: "Exp. Departure",
              value: formatTime(viewRow.expectedDeparture),
            },
            {
              label: "Actual Departure",
              value: formatTime(viewRow.departureTime),
            },

            {
              label: "Ticket Reference",
              value: viewRow.ticketReferenceNo || "-",
            },
            {
              label: "Date",
              value: viewRow.date
                ? new Date(viewRow.date).toLocaleDateString()
                : "-",
            },
          ]}
          onClose={() => setViewRow(null)}
        />
      )}

      {editRow && (
        <EditBusTrip
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleEditSubmit}
          companyData={companyData}
        />
      )}

      {showCommonModal && (
         <CommonBusesView 
            records={records} 
            companyData={companyData} 
            onClose={() => setShowCommonModal(false)}
         />
      )}
      
    </Layout>
  );
};

export default BusTrips;
