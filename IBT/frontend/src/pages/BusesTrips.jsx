import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import Layout from "../components/layout/Layout";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import EditBusTrip from "../components/busTrips/EditBusTrip.jsx";
import DailyTripsDashboard from "../components/busTrips/DailyTripsDashboard.jsx";
import Pagination from "../components/common/Pagination";
import PredefinedArrivalsBoard from "../components/busTrips/CommonBusesView.jsx";
import RequestDeletionModal from "../components/common/RequestDeletionModal";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
import StatCardGroupBus from "../components/busTrips/StatCardGroupBus";
import { submitPageReport } from "../utils/reportService.js";
import ViewModal from "../components/common/ViewModal";
import SharedSubmitReportModal from "../components/common/SharedSubmitReportModal.jsx";
import { logActivity } from "../utils/logger";
import {
  formatBusScheduleDisplay,
  getBusScheduleTimes,
} from "../utils/busSchedule.js";
import NotificationToast from "../components/common/NotificationToast";
import {
  Archive,
  Trash2,
  CheckCircle,
  FileText,
  Loader2,
  History,
  ListChecks,
  X,
  Bus,
  Plus,
  Minus,
  Settings,
  ChevronLeft,  
  ChevronRight,  
  Calendar
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

const formatStopType = (stopType, customStopCount) => {
  if (stopType === "Other") {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return "Other";
  }
  return stopType || "Regular Trip";
};

const normalizeShiftValue = (rawShift) => {
  if (!rawShift) return "";
  const cleaned = String(rawShift).trim();
  const match = cleaned.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!match) return cleaned;

  const start = String(parseInt(match[1], 10)).padStart(2, "0");
  const end = String(parseInt(match[2], 10)).padStart(2, "0");
  return `${start}-${end}`;
};

const parseScheduleParts = (str) => {
  if (!str || typeof str !== "string") {
    return { hour: 8, minute: "00", period: "AM" };
  }
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) {
    return { hour: 8, minute: "00", period: "AM" };
  }
  let h = parseInt(m[1], 10);
  const min = m[2].padStart(2, "0");
  const p = m[3].toUpperCase() === "PM" ? "PM" : "AM";
  if (Number.isNaN(h) || h < 1 || h > 12) h = 8;
  return { hour: h, minute: min, period: p };
};

const buildScheduleTime = (hour, minute, period) => {
  const raw = String(minute ?? "0").replace(/\D/g, "");
  const bounded = Math.min(59, Math.max(0, parseInt(raw, 10) || 0));
  const mm = String(bounded).padStart(2, "0");
  const h = Math.min(12, Math.max(1, Number(hour) || 8));
  return `${h}:${mm} ${period}`;
};

const defaultScheduleSlot = () => ({
  hour: 8,
  minute: "00",
  period: "AM",
});

const formatCollectorDisplayName = (collector) => {
  const middleInitial = collector.middleName
    ? `${String(collector.middleName).trim().charAt(0).toUpperCase()}.`
    : "";
  return [
    collector.firstName,
    middleInitial,
    collector.lastName,
    collector.suffix,
  ]
    .filter(Boolean)
    .join(" ");
};

const parseTo24HourTime = (timeValue) => {
  if (!timeValue) return "";
  const raw = String(timeValue).trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "";
  let hours = parseInt(m[1], 10);
  const minutes = m[2];
  const period = m[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
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
  const [newBusSeatingCapacity, setNewBusSeatingCapacity] = useState("");
  const [scheduleSlots, setScheduleSlots] = useState([defaultScheduleSlot()]);
  const [tableBusTypeFilter, setTableBusTypeFilter] = useState("All");

  const [isProcessing, setIsProcessing] = useState(false);
  const [editCompanyTarget, setEditCompanyTarget] = useState(null);
  const [editBusTarget, setEditBusTarget] = useState(null);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState(null);
  const [deleteBusTarget, setDeleteBusTarget] = useState(null);

  const [newBusType, setNewBusType] = useState("Regular");
  // Maps directly to `Company.buses[].stopType` values:
  // - "Regular Trip" => no stop count
  // - "1-stop" ... "10-stop" => fixed stop count
  const [newBusStopType, setNewBusStopType] = useState("Regular Trip");

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
    setNewBusStopType("Regular Trip");
    setNewBusSeatingCapacity("");
    setScheduleSlots([defaultScheduleSlot()]);
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
        let errorMessage = `Failed to ${editCompanyTarget ? "update" : "create"} company`;
        try {
          const errData = await res.json();
          if (errData?.message) errorMessage = errData.message;
        } catch {
          // Ignore body parse errors and keep fallback message.
        }
        setNotificationState({
          isOpen: true,
          type: "error",
          message: errorMessage,
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

    const cap = Number(newBusSeatingCapacity);
    if (!newBusSeatingCapacity.trim() || Number.isNaN(cap) || cap < 1) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter a valid seating capacity (at least 1).",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const routeString = `${newBusFrom.trim()} - ${newBusTo.trim()}`;
    const built = scheduleSlots.map((s) =>
      buildScheduleTime(s.hour, s.minute, s.period),
    );
    const scheduleTimes = [...new Set(built)];
    const scheduleTimeJoined = scheduleTimes.join(", ");

    const busPayloadBase = {
      plateNumber: newBusPlate.trim(),
      route: routeString,
      busType: newBusType,
      seatingCapacity: cap,
      scheduleTimes,
      scheduleTime: scheduleTimeJoined,
    };

    let updatedBuses;
    if (editBusTarget) {
      updatedBuses = activeCompany.buses.map((b) =>
        b.plateNumber === editBusTarget.plateNumber
          ? {
              ...busPayloadBase,
              departureTime: b.departureTime || "",
              stopType: newBusStopType,
              // `customStopCount` is only used when stopType === "Other".
              // This UI only exposes Regular + 1..10 stop modes.
              customStopCount: null,
            }
          : b,
      );
    } else {
      updatedBuses = [
        ...activeCompany.buses,
        {
          ...busPayloadBase,
          departureTime: "",
          stopType: newBusStopType,
          customStopCount: null,
        },
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
      } else {
        let errorMessage = `Failed to ${editBusTarget ? "update" : "add"} bus`;
        try {
          const errData = await res.json();
          if (errData?.message) errorMessage = errData.message;
        } catch {
          // Ignore body parse errors and keep fallback message.
        }

        setNotificationState({
          isOpen: true,
          type: "error",
          message: errorMessage,
          autoClose: true,
          duration: 3500,
        });
      }
    } catch (err) {
      console.error(err);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: `Error ${editBusTarget ? "updating" : "adding"} bus`,
        autoClose: true,
        duration: 3000,
      });
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABC-1234"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusPlate}
                      onChange={(e) => setNewBusPlate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Bus Type
                    </label>
                    <select
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors bg-white"
                      value={newBusType}
                      onChange={(e) => setNewBusType(e.target.value)}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Aircon">Aircon</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 49"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusSeatingCapacity}
                      onChange={(e) =>
                        setNewBusSeatingCapacity(
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      No. of Stops
                    </label>
                    <select
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors bg-white"
                      value={newBusStopType}
                      onChange={(e) => setNewBusStopType(e.target.value)}
                    >
                      <option value="Regular Trip">Regular trip (Default)</option>
                      <option value="1-stop">1</option>
                      <option value="2-stop">2</option>
                      <option value="3-stop">3</option>
                      <option value="4-stop">4</option>
                      <option value="5-stop">5</option>
                      <option value="6-stop">6</option>
                      <option value="7-stop">7</option>
                      <option value="8-stop">8</option>
                      <option value="9-stop">9</option>
                      <option value="10-stop">10</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Schedule times (AM/PM)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setScheduleSlots((prev) => [
                          ...prev,
                          defaultScheduleSlot(),
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={14} />
                      Add time
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    One bus can run several trips per day — add each departure
                    time.
                  </p>
                  <div className="mt-2 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {scheduleSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
                      >
                        <select
                          className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white min-w-[4.5rem]"
                          value={slot.hour}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setScheduleSlots((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, hour: v } : s,
                              ),
                            );
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ),
                          )}
                        </select>
                        <span className="text-slate-400 font-medium">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="00"
                          className="w-14 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-center"
                          value={slot.minute}
                          onChange={(e) => {
                            const v = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2);
                            setScheduleSlots((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, minute: v } : s,
                              ),
                            );
                          }}
                          onBlur={() => {
                            setScheduleSlots((prev) =>
                              prev.map((s, i) => {
                                if (i !== idx) return s;
                                const n = parseInt(s.minute, 10);
                                let mm = "00";
                                if (!Number.isNaN(n) && n >= 0) {
                                  mm =
                                    n > 59
                                      ? "59"
                                      : String(n).padStart(2, "0");
                                }
                                return { ...s, minute: mm };
                              }),
                            );
                          }}
                        />
                        <select
                          className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white min-w-[5.5rem]"
                          value={slot.period}
                          onChange={(e) => {
                            const v = e.target.value;
                            setScheduleSlots((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, period: v } : s,
                              ),
                            );
                          }}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        {scheduleSlots.length > 1 && (
                          <button
                            type="button"
                            title="Remove this time"
                            onClick={() =>
                              setScheduleSlots((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Route — From
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zamboanga"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusFrom}
                      onChange={(e) => setNewBusFrom(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Route — To
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Manila"
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                      value={newBusTo}
                      onChange={(e) => setNewBusTo(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-1">
                    <button
                      type="button"
                      onClick={handleSaveBus}
                      className="flex-1 h-[38px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {editBusTarget ? "Save" : "Add"}
                    </button>
                    {editBusTarget && (
                      <button
                        type="button"
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
                        <th className="px-4 py-3">Bus No.</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Capacity</th>
                        <th className="px-4 py-3">Departure</th>
                        <th className="px-4 py-3">Schedule</th>
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
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {bus.plateNumber}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${bus.busType === "Aircon" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                              >
                                {bus.busType || "Regular"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 tabular-nums">
                              {bus.seatingCapacity != null
                                ? bus.seatingCapacity
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 tabular-nums">
                              {bus.departureTime || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm max-w-[220px]">
                              {formatBusScheduleDisplay(bus) || "—"}
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
                                    bus.route.split(" - ");
                                  setNewBusFrom(
                                    fromRoute
                                      ? fromRoute.trim()
                                      : bus.route || "",
                                  );
                                  setNewBusTo(toRoute ? toRoute.trim() : "");
                                  setNewBusType(bus.busType || "Regular");
                                  setNewBusSeatingCapacity(
                                    bus.seatingCapacity != null
                                      ? String(bus.seatingCapacity)
                                      : "",
                                  );
                              // Support existing "Other" values by mapping them into 1..10 when possible.
                              if (bus.stopType && bus.stopType !== "Other") {
                                setNewBusStopType(bus.stopType);
                              } else if (
                                bus.customStopCount != null &&
                                Number(bus.customStopCount) >= 1 &&
                                Number(bus.customStopCount) <= 10
                              ) {
                                setNewBusStopType(
                                  `${Number(bus.customStopCount)}-stop`,
                                );
                              } else {
                                setNewBusStopType("Regular Trip");
                              }
                                  const times = getBusScheduleTimes(bus);
                                  setScheduleSlots(
                                    times.length
                                      ? times.map((t) => {
                                          const p = parseScheduleParts(t);
                                          return {
                                            hour: p.hour,
                                            minute: p.minute,
                                            period: p.period,
                                          };
                                        })
                                      : [defaultScheduleSlot()],
                                  );
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
  const toLocalDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateInputToLocalDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return Number.isNaN(dateInput.getTime()) ? null : dateInput;
    }
    const raw = String(dateInput).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = new Date(`${raw}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const [collectorName, setCollectorName] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [collectors, setCollectors] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const getTodayFormatted = () => {
    return toLocalDateKey(new Date());
  };

  const getDateKey = (dateInput) => {
    const d = parseDateInputToLocalDate(dateInput);
    if (!d) return "";
    return toLocalDateKey(d);
  };

  const [dateFilterType, setDateFilterType] = useState("Daily");
  const [currentDateRange, setCurrentDateRange] = useState(new Date());

  const getRangeBounds = (type, date) => {
    if (type === "All") return { start: null, end: null };
    const start = new Date(date);
    const end = new Date(date);

    if (type === "Daily") { start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); } 
    else if (type === "Week") { const day = start.getDay(); start.setDate(start.getDate() - day); start.setHours(0, 0, 0, 0); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999); } 
    else if (type === "Month") { start.setDate(1); start.setHours(0, 0, 0, 0); end.setMonth(end.getMonth() + 1); end.setDate(0); end.setHours(23, 59, 59, 999); } 
    else if (type === "Year") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); end.setMonth(11, 31); end.setHours(23, 59, 59, 999); }
    return { start, end };
  };

  const { start: filterStart, end: filterEnd } = getRangeBounds(dateFilterType, currentDateRange);

  const handlePrevPeriod = () => {
    if (dateFilterType === "All") return;
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() - 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() - 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() - 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDateRange(newDate); setCurrentPage(1);
  };

  const handleNextPeriod = () => {
    if (dateFilterType === "All") return;
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() + 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() + 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() + 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDateRange(newDate); setCurrentPage(1);
  };

  const getPeriodDisplayStr = () => {
    if (dateFilterType === "All") return "All Time";
    const { start, end } = getRangeBounds(dateFilterType, currentDateRange);
    if (dateFilterType === "Daily") return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    else if (dateFilterType === "Week") return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    else if (dateFilterType === "Month") return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    else if (dateFilterType === "Year") return start.getFullYear().toString();
  };

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBusType, setSelectedBusType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [companyData, setCompanyData] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showManageCompaniesModal, setShowManageCompaniesModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [archiveRow, setArchiveRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deletionRequestRow, setDeletionRequestRow] = useState(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [logoutRow, setLogoutRow] = useState(null);
  const [ticketRefInput, setTicketRefInput] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [sessionStartedAt] = useState(() => new Date().toISOString());
  const [missedBuses, setMissedBuses] = useState([]);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [isMissedLoading, setIsMissedLoading] = useState(false);
  const [hasSubmittedShiftReport, setHasSubmittedShiftReport] = useState(false);
  const [showPreviousShiftModal, setShowPreviousShiftModal] = useState(false);
  const [previousShiftReports, setPreviousShiftReports] = useState([]);
  const [isPreviousShiftLoading, setIsPreviousShiftLoading] = useState(false);
  const [rescheduleTrip, setRescheduleTrip] = useState(null);
  const [rescheduledExpectedDeparture, setRescheduledExpectedDeparture] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const role = localStorage.getItem("authRole") || "bus";
  const authAdminId = localStorage.getItem("authAdminId") || "";
  const [assignedShift, setAssignedShift] = useState(() =>
    normalizeShiftValue(localStorage.getItem("authShift") || ""),
  );
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/bustrips`;
  const PREDEFINED_TODAY_API_URL = `${API_URL}/predefined-today`;
  const COMPANY_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/companies`;
  const ADMINS_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/admins`;
  const COLLECTORS_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/collectors`;
  const SCHEDULE_NOT_ARRIVAL_API = `${
    import.meta.env.VITE_API_URL || "http://localhost:10000"
  }/api/schedule-not-arrivals`;
  const REPORTS_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/reports`;

  const [defaultPrice, setDefaultPrice] = useState(75);
  const [predefinedTodayTrips, setPredefinedTodayTrips] = useState([]);
  const ACTIVE_DISPATCH_STATUSES = useMemo(
    () => ["Arrived", "On Fix", "Departed", "Paid"],
    [],
  );

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

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const res = await fetch(`${COLLECTORS_API_URL}?active=true`);
        if (!res.ok) return;
        const data = await res.json();
        setCollectors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };

    fetchCollectors();
  }, [COLLECTORS_API_URL]);

  const fetchPreviousShiftReports = async () => {
    if (role !== "bus") return;
    setIsPreviousShiftLoading(true);
    try {
      const res = await fetch(REPORTS_API_URL);
      if (!res.ok) throw new Error("Failed to load reports.");
      const data = await res.json();
      const ownReports = (Array.isArray(data) ? data : [])
        .filter((report) => {
          if (report.type !== "Bus Trips") return false;
          const reportAdminId = report?.data?.adminId;
          return authAdminId ? String(reportAdminId || "") === String(authAdminId) : true;
        })
        .sort(
          (a, b) =>
            new Date(b?.data?.submittedAtServer || b.createdAt).getTime() -
            new Date(a?.data?.submittedAtServer || a.createdAt).getTime(),
        )
        .slice(0, 10);
      setPreviousShiftReports(ownReports);
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to fetch previous shift reports.",
        autoClose: true,
        duration: 3500,
      });
    } finally {
      setIsPreviousShiftLoading(false);
    }
  };

  const getBoardDateKey = () => {
    if (role === "bus") return getDateKey(new Date());
    if (dateFilterType === "Daily") return getDateKey(currentDateRange);
    return getDateKey(new Date());
  };

  const fetchMissedBuses = async () => {
    const dateKey = getBoardDateKey();
    if (!dateKey) return;
    setIsMissedLoading(true);
    try {
      const res = await fetch(
        `${SCHEDULE_NOT_ARRIVAL_API}?dateKey=${encodeURIComponent(dateKey)}`,
      );
      if (!res.ok) throw new Error("Failed to load missed buses.");
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        status: "Not Arrive",
      }));
      setMissedBuses(normalized);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMissedLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedBuses();
  }, [role, dateFilterType, currentDateRange]);

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
    stopType: "Regular Trip",
    customStopCount: "",
    time: "",
    date: getTodayFormatted(),
    status: "Scheduled",
    price: 75,
    parkingEstimation: "10 minutes",
    expectedDeparture: "",
    seatingCapacity: null,
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

  const fetchPredefinedTodayTrips = async () => {
    try {
      const response = await fetch(PREDEFINED_TODAY_API_URL);
      if (!response.ok) throw new Error("Failed to fetch scheduled trips.");
      const data = await response.json();
      setPredefinedTodayTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching today's scheduled trips:", error);
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
    fetchPredefinedTodayTrips();
  }, [role]);

  useEffect(() => {
    const resolveAssignedShift = async () => {
      if (role !== "bus") return;

      const current = normalizeShiftValue(localStorage.getItem("authShift") || "");
      if (current) {
        setAssignedShift(current);
        return;
      }

      const authEmail = (localStorage.getItem("authEmail") || "").toLowerCase();
      if (!authEmail) return;

      try {
        const res = await fetch(ADMINS_API_URL);
        if (!res.ok) return;
        const admins = await res.json();
        const mine = admins.find(
          (admin) => (admin.email || "").toLowerCase() === authEmail,
        );

        const resolved = normalizeShiftValue(mine?.assignedShift || "");
        if (resolved) {
          setAssignedShift(resolved);
          localStorage.setItem("authShift", resolved);
        }
      } catch (error) {
        console.error("Failed to resolve assigned shift:", error);
      }
    };

    resolveAssignedShift();
  }, [role, ADMINS_API_URL]);

  useEffect(() => {
    if (role === "bus") {
      setDateFilterType("Daily");
      setCurrentDateRange(new Date());
    }
  }, [role]);
  
  const availableCompanies = companyData.map((c) => c.name);

  const filtered = records.filter((bus) => {
    const templateNo = bus.templateNo || bus.templateno || "";
    const matchesSearch =
      templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bus.route || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;
    const matchesBusType =
      selectedBusType === "" || bus.busType === selectedBusType;
    const matchesStatus =
      selectedStatus === "" || bus.status === selectedStatus;

    const busDate = bus.date ? parseDateInputToLocalDate(bus.date) : null;
    let matchesDateRange = false;

    if (dateFilterType === "All") {
      matchesDateRange = true;
    } else if (busDate && !Number.isNaN(busDate.getTime())) {
      matchesDateRange = busDate >= filterStart && busDate <= filterEnd;
    }

    return (
      matchesSearch &&
      matchesCompany &&
      matchesDateRange &&
      matchesBusType &&
      matchesStatus
    );
  });

  const filteredWithoutDate = records.filter((bus) => {
    const templateNo = bus.templateNo || bus.templateno || "";
    const matchesSearch =
      templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bus.route || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;
    const matchesBusType =
      selectedBusType === "" || bus.busType === selectedBusType;
    const matchesStatus =
      selectedStatus === "" || bus.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesBusType && matchesStatus;
  });

  const totalRevenue = filtered
    .filter((t) => t.status === "Departed")
    .reduce((sum, t) => sum + (Number(t.price) || 75), 0);

  const todayDispatchRecords = useMemo(() => {
    if (role === "bus") {
      const todayKey = getDateKey(new Date());
      return filteredWithoutDate.filter((trip) => {
        const tripDayKey = getDateKey(trip.date);
        return tripDayKey === todayKey;
      });
    }
    return filtered; 
  }, [filtered, filteredWithoutDate, role]);

  const activeDispatchRecords = useMemo(
    () =>
      todayDispatchRecords.filter((trip) =>
        ACTIVE_DISPATCH_STATUSES.includes(trip.status),
      ),
    [todayDispatchRecords, ACTIVE_DISPATCH_STATUSES],
  );

 const reportCompletedRecords = useMemo(() => {
    if (role === "bus") {
      const todayKey = getDateKey(new Date());
      return records.filter(trip => getDateKey(trip.date) === todayKey && trip.status === "Departed");
    }
    return filtered.filter(trip => trip.status === "Departed");
  }, [records, filtered, role]);

  const dashboardTotalTrips = todayDispatchRecords.length;
  const dashboardPredefinedSchedules = useMemo(() => {
    const todayKey = getDateKey(new Date());
    const makeScheduleKey = (company, route, scheduleTime, plateNumber) =>
      `${company}|||${route}|||${scheduleTime}|||${plateNumber}`;

    const statusByScheduleKey = new Map();
    for (const r of records) {
      if (getDateKey(r.date) !== todayKey) continue;
      const plate = r.templateNo || r.templateno;
      if (!plate) continue;
      const scheduledTime = String(r.scheduledTime || "").trim();
      if (!scheduledTime) continue;
      const key = makeScheduleKey(
        r.company || "",
        String(r.route || "").trim(),
        scheduledTime,
        plate,
      );
      const st = r.status;
      const prev = statusByScheduleKey.get(key);
      const rank = (s) => {
        if (s === "Scheduled" || s === "Pending") return 1;
        if (s === "Arrived" || s === "On Fix" || s === "Not Departed") return 2;
        if (s === "Departed" || s === "Paid") return 3;
        return 0;
      };
      if (!prev || rank(st) >= rank(prev)) statusByScheduleKey.set(key, st);
    }

    const notArrivePlateCompanyKeys = new Set(
      missedBuses.map((m) => `${m.plateNumber}|||${m.company}`),
    );

    let actionable = 0;
    companyData.forEach((company) => {
      (company.buses || []).forEach((bus) => {
        if (!bus?.route?.trim()) return;
        const times = getBusScheduleTimes(bus);
        times.forEach((scheduleTimeRaw) => {
          const scheduleTime = String(scheduleTimeRaw || "").trim();
          if (!scheduleTime) return;
          const scheduleKey = makeScheduleKey(
            company.name,
            bus.route.trim(),
            scheduleTime,
            bus.plateNumber,
          );
          const plateCompanyKey = `${bus.plateNumber}|||${company.name}`;
          const status = statusByScheduleKey.get(scheduleKey);
          const loggedToday =
            status === "Arrived" ||
            status === "On Fix" ||
            status === "Departed" ||
            status === "Paid";
          if (!loggedToday && !notArrivePlateCompanyKeys.has(plateCompanyKey)) {
            actionable += 1;
          }
        });
      });
    });

    return actionable;
  }, [companyData, records, missedBuses]);

  const dashboardArrivedTrips = todayDispatchRecords.filter(
    (t) => t.status === "Arrived",
  ).length;
  const dashboardPaidTrips = todayDispatchRecords.filter(
    (t) => t.status === "Departed",
  ).length;
  const dashboardTotalRevenue = todayDispatchRecords
    .filter((t) => t.status === "Departed")
    .reduce((sum, t) => sum + (Number(t.price) || 75), 0);

  const visibleDispatchRecords = useMemo(
    () => activeDispatchRecords,
    [activeDispatchRecords],
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleDispatchRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleDispatchRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(visibleDispatchRecords.length / itemsPerPage);

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
      stopType: "Regular Trip",
      customStopCount: "",
      time: currentTime,
      date: getTodayFormatted(),
      status: "Scheduled",
      price: defaultPrice,
      parkingEstimation: "10 minutes",
      expectedDeparture: calculateExpectedDeparture(currentTime, "10 minutes"),
      seatingCapacity: null,
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
      time: selectedBus?.departureTime || prev.time,
      stopType: selectedBus?.stopType || "Regular Trip",
      customStopCount: selectedBus?.customStopCount
        ? String(selectedBus.customStopCount)
        : "",
      seatingCapacity:
        selectedBus?.seatingCapacity != null
          ? selectedBus.seatingCapacity
          : null,
    }));
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();

    if (
      newBusData.stopType === "Other" &&
      (!newBusData.customStopCount || Number(newBusData.customStopCount) < 1)
    ) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter a valid custom stop count.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    try {
      const tripData = {
        ...newBusData,
        customStopCount:
          newBusData.stopType === "Other"
            ? Number(newBusData.customStopCount)
            : null,
        price: newBusData.price || defaultPrice,
        seatingCapacity:
          newBusData.seatingCapacity != null
            ? Number(newBusData.seatingCapacity)
            : null,
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

  const handleToggleOnFixStatus = async (trip) => {
    const tripId = trip?._id || trip?.id;
    if (!tripId) return;

    // On Fix should only be toggled from Arrived or On Fix states.
    if (!["Arrived", "On Fix"].includes(trip.status)) return;

    if (trip.status === "On Fix") {
      setRescheduleTrip(trip);
      setRescheduledExpectedDeparture(parseTo24HourTime(trip.expectedDeparture));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "On Fix" }),
      });

      if (!response.ok) throw new Error("Failed to update bus status.");

      await fetchBusTrips();
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "successfully updated to under maintenance",
        autoClose: true,
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to update bus status.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleConfirmRescheduleFromFix = async () => {
    const tripId = rescheduleTrip?._id || rescheduleTrip?.id;
    if (!tripId || !rescheduledExpectedDeparture) return;
    try {
      const response = await fetch(`${API_URL}/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Arrived",
          expectedDeparture: rescheduledExpectedDeparture,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to reschedule bus after maintenance.");
      }
      setRescheduleTrip(null);
      setRescheduledExpectedDeparture("");
      await fetchBusTrips();
      setNotificationState({
        isOpen: true,
        type: "success",
        message: `Maintenance complete. New expected departure set to ${rescheduledExpectedDeparture}.`,
        autoClose: true,
        duration: 3500,
      });
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Could not reschedule bus.",
        autoClose: true,
        duration: 3500,
      });
    }
  };

  const handleMarkNotDeparted = async (trip) => {
    const tripId = trip?._id || trip?.id;
    if (!tripId || trip.status !== "Arrived") return;

    try {
      const response = await fetch(`${API_URL}/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Not Departed" }),
      });

      if (response.ok) {
        await fetchBusTrips();
        setNotificationState({
          isOpen: true,
          type: "warning",
          message: "Bus marked as Not Departed.",
          autoClose: true,
          duration: 3000,
        });
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
    if (!collectorName.trim() || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please select Collector Name before exporting.",
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
      await addImageToWorksheet(workbook, worksheet, headerImg, "A1:J4");

      worksheet.mergeCells("A6:J6");
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
        "Stop Type",
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
          formatStopType(item.stopType, item.customStopCount),
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
        `A${lastRowNumber}:J${lastRowNumber + 3}`,
      );

      worksheet.columns = [
        { width: 14 },
        { width: 12 },
        { width: 14 },
        { width: 18 },
        { width: 22 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 15 },
        { width: 16 },
        { width: 14 },
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
    if (!collectorName.trim() || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please select Collector Name before exporting.",
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
          "Stop Type",
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
        formatStopType(item.stopType, item.customStopCount),
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
    if (!collectorName.trim() || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "warning",
        message: "Please select a Collector before submitting.",
        autoClose: true,
        duration: 3000,
      });
      setShowSubmitModal(false); // Close modal so they can type the name
      return;
    }

    if (!assignedShift) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "No assigned shift found for this account. Contact Super Admin.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const currentHour = new Date().getHours();
    const [startHour, endHourStr] = assignedShift.split("-").map((s) => parseInt(s, 10));
    const endHour = endHourStr === 24 ? 0 : endHourStr;
    let isLateSubmit = false;

    if (startHour < endHour) {
      if (currentHour < startHour || currentHour >= endHour) isLateSubmit = true;
    } else {
      if (currentHour >= endHour && currentHour < startHour) isLateSubmit = true;
    }

    setIsReporting(true);
    try {
      const reportPayload = {
        screen: "Bus Trips Management",
        adminId: authAdminId || null,
        assignedShift: assignedShift || "No assigned shift",
        collectorId,
        collectorName: collectorName.trim(),
        sessionStartedAt,
        submittedLate: isLateSubmit,
        completedTransactions: reportCompletedRecords.map((trip) => ({
          id: trip._id || trip.id,
          templateNo: trip.templateNo || trip.templateno,
          company: trip.company,
          route: trip.route,
          status: trip.status,
          arrivalTime: trip.time || "",
          departureTime: trip.departureTime || "",
        })),
        missedTransactions: missedBuses.map((missed) => ({
          plateNumber: missed.plateNumber,
          company: missed.company,
          route: missed.route,
          scheduleTime: missed.scheduleTime,
          remark: missed.remark || "",
        })),
      };
      
      await submitPageReport(
        "Bus Trips",
        reportPayload,
        localStorage.getItem("authName") ||
          localStorage.getItem("authEmail") ||
          "Admin",
      );

      if (missedBuses.length > 0) {
        await Promise.all(
          missedBuses.map(async (missed) => {
            const params = new URLSearchParams({
              dateKey: String(missed.dateKey || ""),
              company: String(missed.company || ""),
              route: String(missed.route || ""),
              scheduleTime: String(missed.scheduleTime || ""),
              plateNumber: String(missed.plateNumber || ""),
            });
            await fetch(`${SCHEDULE_NOT_ARRIVAL_API}?${params}`, { method: "DELETE" });
          }),
        );
        await fetchMissedBuses();
      }
      
      setShowSubmitModal(false);
      setCollectorName(""); 
      setCollectorId("");
      
      setNotificationState({ 
        isOpen: true, 
        type: "success", 
        message: "Shift Handoff Report Submitted!", 
        autoClose: true, 
        duration: 3000 
      });
      if (role === "bus") setHasSubmittedShiftReport(true);
      
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

  const handleUndoMissedBus = async (missedRow) => {
    try {
      const params = new URLSearchParams({
        dateKey: String(missedRow.dateKey || ""),
        company: String(missedRow.company || ""),
        route: String(missedRow.route || ""),
        scheduleTime: String(missedRow.scheduleTime || ""),
        plateNumber: String(missedRow.plateNumber || ""),
      });
      const res = await fetch(`${SCHEDULE_NOT_ARRIVAL_API}?${params}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to undo not-arrive.");
      await fetchMissedBuses();
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Missed bus undone. It is available in Predefined Schedule again.",
        autoClose: true,
        duration: 3000,
      });
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to undo missed bus.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleMarkMissedAsArrived = async (missedRow) => {
    try {
      await handlePredefinedArrival({
        templateNo: missedRow.plateNumber,
        company: missedRow.company,
        route: missedRow.route,
        scheduleTime: missedRow.scheduleTime,
      });
      await handleUndoMissedBus(missedRow);
      await fetchBusTrips();
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to mark missed bus as arrived.",
        autoClose: true,
        duration: 3000,
      });
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
          actionAdminId: authAdminId || undefined,
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
      const plateNo = fullRecord.templateNo || fullRecord.templateno;
      const comp = companyData.find((c) => c.name === fullRecord.company);
      const busDef = comp?.buses?.find((b) => b.plateNumber === plateNo);

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

      const seatingCapacity =
        fullRecord.seatingCapacity != null
          ? fullRecord.seatingCapacity
          : busDef?.seatingCapacity != null
            ? busDef.seatingCapacity
            : null;

      const arrivalPayload = {
        status: "Arrived",
        time: actualArrivalTime,
        expectedDeparture: newExpectedDeparture,
        parkingEstimation: estimationStr,
        actionAdminId: authAdminId || undefined,
      };
      if (seatingCapacity != null) {
        arrivalPayload.seatingCapacity = seatingCapacity;
      }

      const response = await fetch(`${API_URL}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arrivalPayload),
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

  const handlePredefinedArrival = async (suggestion) => {
    const todayKey = getDateKey(new Date());
    const plate = suggestion.templateNo;
    const company = suggestion.company;
    const scheduledTime = String(suggestion.scheduleTime || "").trim();
    const activeStatuses = [
      "Scheduled",
      "Pending",
      "Arrived",
      "On Fix",
      "Not Departed",
    ];

    const existing = records.find((r) => {
      if (getDateKey(r.date) !== todayKey) return false;
      const p = r.templateNo || r.templateno;
      if (p !== plate || r.company !== company) return false;
      if (String(r.route || "").trim() !== String(suggestion.route || "").trim()) {
        return false;
      }
      if (scheduledTime) {
        if (String(r.scheduledTime || "").trim() !== scheduledTime) return false;
      }
      return activeStatuses.includes(r.status);
    });

    if (existing) {
      if (
        ["Arrived", "On Fix", "Departed", "Paid"].includes(
          existing.status,
        )
      ) {
        setNotificationState({
          isOpen: true,
          type: "warning",
          message: `Bus ${plate} is already logged today (${existing.status}).`,
          autoClose: true,
          duration: 4000,
        });
        return;
      }
      await handleMarkArrived({ ...existing, id: existing.id || existing._id });
      return;
    }

    const comp = companyData.find((c) => c.name === company);
    const busDef = comp?.buses?.find((b) => b.plateNumber === plate);
    const stopType = busDef?.stopType || suggestion.stopType || "Regular Trip";
    const customStopCount =
      stopType === "Other"
        ? Number(busDef?.customStopCount ?? suggestion.customStopCount)
        : null;

    if (stopType === "Other" && (!customStopCount || customStopCount < 1)) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message:
          "This bus needs a valid stop type in Manage Companies before quick arrival.",
        autoClose: true,
        duration: 5000,
      });
      return;
    }

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const actualArrivalTime = `${currentHours}:${currentMinutes}`;
    const estimationStr = "10 minutes";
    const newExpectedDeparture = calculateExpectedDeparture(
      actualArrivalTime,
      estimationStr,
    );

    const seatingCap =
      suggestion.seatingCapacity != null
        ? suggestion.seatingCapacity
        : busDef?.seatingCapacity != null
          ? busDef.seatingCapacity
          : null;

    const tripData = {
      templateNo: plate,
      company,
      route: suggestion.route,
      scheduledTime,
      busType: busDef?.busType || suggestion.busType || "Regular",
      stopType,
      customStopCount: stopType === "Other" ? customStopCount : null,
      time: actualArrivalTime,
      date: todayKey,
      status: "Arrived",
      arrivalAdminId: authAdminId || null,
      arrivalLoggedAt: new Date().toISOString(),
      price: defaultPrice,
      parkingEstimation: estimationStr,
      expectedDeparture: newExpectedDeparture,
      ...(seatingCap != null ? { seatingCapacity: seatingCap } : {}),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        await fetchBusTrips();
        await logActivity(
          role,
          "CREATE_TRIP",
          `Predefined schedule arrival: ${payload.templateNo || plate} — ${suggestion.route}`,
          "BusTrips",
        );
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Recorded arrival for ${plate}.`,
          autoClose: true,
          duration: 3000,
        });
        return;
      }

      if (
        payload.message &&
        String(payload.message).includes("already has an active trip")
      ) {
        await fetchBusTrips();
        setNotificationState({
          isOpen: true,
          type: "warning",
          message:
            "Trip was created elsewhere; refreshing. Try Arrived again if needed.",
          autoClose: true,
          duration: 4000,
        });
        return;
      }

      setNotificationState({
        isOpen: true,
        type: "error",
        message: payload.message || "Could not record arrival.",
        autoClose: true,
        duration: 5000,
      });
    } catch (error) {
      console.error(error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Error recording arrival.",
        autoClose: true,
        duration: 4000,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchBusTrips();
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

  const handleRequestDeletion = async () => {
    if (!deletionRequestRow) return;
    const trimmedReason = deletionReason.trim();
    if (!trimmedReason) {
      setNotificationState({
        isOpen: true,
        type: "warning",
        message: "Reason for deletion is required.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/deletion-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: "Bus Trip",
            itemDescription: `Plate No: ${deletionRequestRow.templateNo || deletionRequestRow.templateno} - ${deletionRequestRow.company}`,
            requestedBy: localStorage.getItem("authName") || "Bus Admin",
            originalData: deletionRequestRow,
            reason: trimmedReason,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to submit deletion request.");

      setDeletionRequestRow(null);
      setDeletionReason("");
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Deletion request sent to Superadmin.",
        autoClose: true,
        duration: 3000,
      });
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to submit deletion request.",
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
    <Layout
      title="Bus Trips Management"
      topbarProps={{
        logoutGuard:
          role === "bus"
            ? {
                canLogout: hasSubmittedShiftReport,
                message:
                  "Please submit your Bus Admin shift report before logging out. This protects shift accountability and keeps turnover records complete.",
              }
            : undefined,
      }}
    >
      <div className="mb-6">
        <StatCardGroupBus
          totalTrips={dashboardTotalTrips}
          predefinedSchedules={dashboardPredefinedSchedules}
          arrivedTrips={dashboardArrivedTrips}
          paidTrips={dashboardPaidTrips}
          missedTrips={missedBuses.length}
          totalRevenue={dashboardTotalRevenue}
        />
      </div>

      <div className="px-4 lg:px-8">
        <div className="flex flex-col gap-4 w-full mb-4">
          
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            
            <div className="flex-1 w-full">
              <BusTripFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCompany={selectedCompany}
                setSelectedCompany={setSelectedCompany}
                uniqueCompanies={availableCompanies}
                selectedBusType={selectedBusType}
                setSelectedBusType={setSelectedBusType}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
            </div>

            {role === "superadmin" && (
              <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2 w-full xl:w-auto">
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[42px]">
                  {["All", "Daily", "Week", "Month", "Year"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setDateFilterType(type);
                        setCurrentDateRange(new Date());
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        dateFilterType === type
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {dateFilterType !== "All" && (
                  <div className="flex items-center justify-between border border-slate-200 bg-white rounded-xl h-[42px] min-w-[240px] px-2 shadow-sm">
                    <button onClick={handlePrevPeriod} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      <Calendar size={16} className="text-slate-400" />
                      {getPeriodDisplayStr()}
                    </div>
                    <button onClick={handleNextPeriod} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <PredefinedArrivalsBoard
            records={records}
            companyData={companyData}
            getDateKey={getDateKey}
            onConfirmArrival={handlePredefinedArrival}
            onNotArriveSaved={fetchMissedBuses}
            onNotArriveRemoved={fetchMissedBuses}
            onNotify={(type, message) =>
              setNotificationState({
                isOpen: true,
                type,
                message,
                autoClose: true,
                duration: 4500,
              })
            }
            searchQuery={searchQuery}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            {isSelectionMode && selectedIds.length > 0 && role === "bus" && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 px-2">
                  {selectedIds.length} Selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  title={role === "bus" ? "Request Deletion" : "Delete Selected"}
                  className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 shadow-sm border cursor-pointer"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}

            <div className={`flex flex-wrap items-center justify-end gap-3 ${isSelectionMode ? "ml-auto" : "w-full"}`}>
              {role === "bus" && (
                <div className="mr-auto flex flex-wrap items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                    Collector:
                  </label>
                  <select
                    value={collectorId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const selectedCollector = collectors.find(
                        (collector) => (collector._id || collector.id) === nextId,
                      );
                      setCollectorId(nextId);
                      setCollectorName(
                        selectedCollector ? formatCollectorDisplayName(selectedCollector) : "",
                      );
                    }}
                    className="w-full sm:w-56 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">Select collector</option>
                    {collectors.map((collector) => {
                      const label = formatCollectorDisplayName(collector);
                      return (
                        <option key={collector._id || collector.id} value={collector._id || collector.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={() => {
                      if (!collectorName.trim() || !collectorId) {
                        setNotificationState({
                          isOpen: true,
                          type: "warning",
                          message: "Please select a Collector before submitting.",
                          autoClose: true,
                          duration: 3000,
                        });
                        return;
                      }
                      setShowSubmitModal(true);
                    }}
                    disabled={!collectorName.trim() || !collectorId}
                    className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FileText size={18} />
                    <span>Submit Report</span>
                  </button>
                  <button
                    onClick={() => setShowMissedModal(true)}
                    className="flex items-center cursor-pointer justify-center space-x-2 border border-amber-200 bg-white text-amber-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-amber-50 transition-all"
                  >
                    <span>View Missed Buses</span>
                  </button>
                  <button
                    onClick={() => {
                      fetchPreviousShiftReports();
                      setShowPreviousShiftModal(true);
                    }}
                    className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                  >
                    <span>Previous Shift Records</span>
                  </button>
                </div>
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
                  className={`flex items-center justify-center h-[42px] w-[42px] sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${isSelectionMode ? "bg-red-500 text-white" : "bg-white border-slate-200 text-slate-500"}`}
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
              role={role}
              onApproveDeparture={handleApproveDeparture}
              onToggleOnFixStatus={handleToggleOnFixStatus}
              onMarkArrived={handleMarkArrived}
              onViewTrip={setViewRow}
              onEditTrip={setEditRow}
              onArchiveTrip={setArchiveRow}
              onDeleteTrip={setDeleteRow}
              onRequestDeleteTrip={(row) => {
                setDeletionRequestRow(row);
                setDeletionReason("");
              }}
            />
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              itemsPerPage={itemsPerPage} 
              totalItems={visibleDispatchRecords.length} 
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
        setNotificationState={setNotificationState}
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg max-h-[min(88vh,800px)] my-4 sm:my-8 overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-xl animate-in fade-in zoom-in-95">
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
                        stopType: "Regular Trip",
                        customStopCount: "",
                        templateNo: "",
                        route: "",
                        seatingCapacity: null,
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
                        stopType: "Regular Trip",
                        customStopCount: "",
                        templateNo: "",
                        route: "",
                        seatingCapacity: null,
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
                              ["Scheduled", "Pending", "Arrived", "On Fix", "Not Departed"].includes(
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
                      Stop Type
                    </label>
                    <input
                      type="text"
                      value={formatStopType(
                        newBusData.stopType,
                        newBusData.customStopCount,
                      )}
                      readOnly
                      placeholder="Select bus number first"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 font-medium cursor-not-allowed"
                    />
                  </div>
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
                  const alphaNumericValue = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  setTicketRefInput(alphaNumericValue);
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

      <RequestDeletionModal
        isOpen={!!deletionRequestRow}
        onClose={() => {
          setDeletionRequestRow(null);
          setDeletionReason("");
        }}
        onConfirm={handleRequestDeletion}
        itemIdentifier={
          deletionRequestRow
            ? `Plate No: ${deletionRequestRow.templateNo || deletionRequestRow.templateno}`
            : ""
        }
        remarks={deletionReason}
        setRemarks={setDeletionReason}
      />

      {showMissedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Missed / Not Arrive Buses</h3>
              <button
                onClick={() => setShowMissedModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {isMissedLoading ? (
              <div className="py-10 text-center text-slate-500">Loading missed buses...</div>
            ) : missedBuses.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No missed buses for this operating day.</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Bus No</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Remark</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {missedBuses.map((missed) => (
                      <tr
                        key={`${missed.dateKey}-${missed.company}-${missed.route}-${missed.scheduleTime}-${missed.plateNumber}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{missed.plateNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{missed.route}</td>
                        <td className="px-4 py-3 text-slate-600">{missed.company}</td>
                        <td className="px-4 py-3 text-slate-600">{missed.scheduleTime}</td>
                        <td className="px-4 py-3 text-slate-600">{missed.remark || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUndoMissedBus(missed)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                            >
                              Undo
                            </button>
                            <button
                              onClick={() => handleMarkMissedAsArrived(missed)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                            >
                              Mark as Arrived
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <SharedSubmitReportModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitReport}
        requiresCollector={false}
        moduleName="Bus"
        assignedShift={assignedShift}
        collectorName={collectorName}
        totalRecords={reportCompletedRecords.length + missedBuses.length}
        helperText="(Includes completed departures and missed buses; parked buses remain on TDB)"
        isSubmitting={isReporting}
        submitDisabled={!assignedShift}
        submitLabel="Confirm Hand-off"
      />

      {showPreviousShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Previous Shift Records</h3>
              <button
                onClick={() => setShowPreviousShiftModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {isPreviousShiftLoading ? (
              <div className="py-10 text-center text-slate-500">Loading previous shift reports...</div>
            ) : previousShiftReports.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No previous shift reports found for this Bus Admin.</div>
            ) : (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Collector</th>
                      <th className="px-4 py-3">Completed</th>
                      <th className="px-4 py-3">Missed</th>
                      <th className="px-4 py-3">Late</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previousShiftReports.map((report) => {
                      const completed =
                        report?.data?.completedTransactions?.length ??
                        report?.data?.statistics?.completedCount ??
                        0;
                      const missed =
                        report?.data?.missedTransactions?.length ??
                        report?.data?.statistics?.missedCount ??
                        0;
                      return (
                        <tr key={report._id || report.id}>
                          <td className="px-4 py-3 text-slate-700">
                            {new Date(
                              report?.data?.submittedAtServer || report.createdAt,
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.assignedShift || report?.payload?.assignedShift || report?.data?.shift || report?.payload?.shift || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.collectorName || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{completed}</td>
                          <td className="px-4 py-3 text-slate-700">{missed}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.submittedLate ? "Yes" : "No"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {rescheduleTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Return Bus From Maintenance</h3>
            <p className="text-sm text-slate-600 mb-4">
              Set a new expected departure time for{" "}
              <strong>{rescheduleTrip.templateNo || rescheduleTrip.templateno}</strong> before returning it to the active dispatch board.
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              New Expected Departure Time
            </label>
            <input
              type="time"
              value={rescheduledExpectedDeparture}
              onChange={(e) => setRescheduledExpectedDeparture(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 bg-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRescheduleTrip(null);
                  setRescheduledExpectedDeparture("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRescheduleFromFix}
                disabled={!rescheduledExpectedDeparture}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                Confirm Reschedule
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
            {
              label: "Stop Type",
              value: formatStopType(viewRow.stopType, viewRow.customStopCount),
            },
            { label: "Status", value: viewRow.status || "-" },
            { label: "Price", value: `₱${(viewRow.price || 75).toFixed(2)}` },
            {
              label: "Seating capacity",
              value:
                viewRow.seatingCapacity != null
                  ? String(viewRow.seatingCapacity)
                  : "-",
            },

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

    </Layout>
  );
};

export default BusTrips;
