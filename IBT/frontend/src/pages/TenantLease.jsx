import React, { useState, useMemo, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Archive, Trash2, Mail, Download, Store, MoonStar, Map, ClipboardList, ListChecks, FileText, X, History, Settings, Loader2, CheckCircle, Play, Pause, Wallet, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import TerminalBoardShell from "../components/common/TerminalBoardShell";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import LogModal from "../components/common/LogModal";
import NotificationToast from "../components/common/NotificationToast";

import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";
import RequestDeletionModal from "../components/common/RequestDeletionModal";
import TenantStatusFilter from "../components/tenants/TenantStatusFilter";
import AddTenantModal from "../components/tenants/modals/AddTenantModal";
import MoveOutModal from "../components/tenants/modals/MoveOutModal";
import TenantViewModal from "../components/tenants/modals/TenantViewModal";
import ContractsOverviewModal from "../components/tenants/modals/ContractsOverviewModal";
import ContractManagementModal from "../components/tenants/modals/ContractManagementModal";
import TenantMapModal from "../components/tenants/modals/TenantMapModal";
import WaitlistModal from "../components/tenants/modals/WaitlistModal";
import TenantEmailModal from "../components/tenants/modals/TenantEmailModal";
import ApplicationReviewModal from "../components/tenants/modals/ApplicationReviewModal";
import BroadcastModal from "../components/tenants/modals/BroadcastModal";
import ArchiveConfirmModal from "../components/tenants/modals/ArchiveConfirmModal";
import SharedSubmitReportModal from "../components/common/SharedSubmitReportModal.jsx";

import { generateRentStatementPDF, calculateDueAmount } from "../utils/tenantUtils";
import { logActivity } from "../utils/logger";
import { sendNotification } from "../utils/notificationService.js";
import { submitPageReport } from "../utils/reportService.js";
import { sendBroadcast, archiveTenantRecord, requestBulkDeletion } from "../services/tenantServices.js";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;
const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

const TenantLease = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilterType, setDateFilterType] = useState("All");
    const [currentDateRange, setCurrentDateRange] = useState(new Date());
    const [activeTab, setActiveTab] = useState("permanent");
    const [activeStatus, setActiveStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const role = localStorage.getItem("authRole") || "superadmin";
    const operatorName =
        localStorage.getItem("authName") ||
        localStorage.getItem("authEmail") ||
        (role === "lease" ? "Tenant Admin" : "Admin");
    const asOfDateLabel = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const [records, setRecords] = useState([]);
    const [allTenantRecords, setAllTenantRecords] = useState([]);
    const [waitlistData, setWaitlistData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeWaitlistTab, setActiveWaitlistTab] = useState("All");

    const [defaultNightPrice, setDefaultNightPrice] = useState(150);
    const [defaultNightWeeklyRent, setDefaultNightWeeklyRent] = useState(1050);
    const [showSetPriceModal, setShowSetPriceModal] = useState(false);
    const [newNightPrice, setNewNightPrice] = useState("");
    const [newNightWeeklyRent, setNewNightWeeklyRent] = useState("");
    const [isSettingPrice, setIsSettingPrice] = useState(false);
    const [defaultPermanentPrice, setDefaultPermanentPrice] = useState(6000);
    const [newPermanentPrice, setNewPermanentPrice] = useState("");

    const [permChargePct, setPermChargePct] = useState(25);
    const [permInterestPct, setPermInterestPct] = useState(2);
    const [nightChargePct, setNightChargePct] = useState(25);
    const [nightInterestPct, setNightInterestPct] = useState(2);
    const [nightMaxTerminationDays, setNightMaxTerminationDays] = useState(3);
    
    const [newChargePct, setNewChargePct] = useState("");
    const [newInterestPct, setNewInterestPct] = useState("");
    const [newNightMaxTerminationDays, setNewNightMaxTerminationDays] = useState("");

    const [defaultDueDate, setDefaultDueDate] = useState("5");
    const [newDueDate, setNewDueDate] = useState("");
    const [defaultDailyFee, setDefaultDailyFee] = useState(200);
    const [newDailyFee, setNewDailyFee] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
    const [tenantToMoveOut, setTenantToMoveOut] = useState(null);
    const [showNotify, setShowNotify] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showContractsOverview, setShowContractsOverview] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [showWaitlistForm, setShowWaitlistForm] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showPreviousShiftModal, setShowPreviousShiftModal] = useState(false);
    const [previousShiftReports, setPreviousShiftReports] = useState([]);
    const [isPreviousShiftLoading, setIsPreviousShiftLoading] = useState(false);

    const [showPaymentRecords, setShowPaymentRecords] = useState(false);
    const [paymentViewType, setPaymentViewType] = useState("Week");
    const [paymentRefDate, setPaymentRefDate] = useState(new Date());
    const [paymentTenantTab, setPaymentTenantTab] = useState("Permanent");
    const [selectedPaymentTenantId, setSelectedPaymentTenantId] = useState("");

    const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);     
    const [paymentItemsPerPage, setPaymentItemsPerPage] = useState(25);

    const [isReporting, setIsReporting] = useState(false);
    const [collectors, setCollectors] = useState([]);
    const [collectorId, setCollectorId] = useState("");
    const [collectorName, setCollectorName] = useState("");
    const [deleteRequestIds, setDeleteRequestIds] = useState([]);
    const authAdminId = localStorage.getItem("authAdminId") || "";
    const authEmail = (localStorage.getItem("authEmail") || "").toLowerCase();
    const assignedShiftValue = localStorage.getItem("authShift") || "";
    const REPORTS_API_URL = `${API_URL}/reports`;
    const [sessionStartedAt, setSessionStartedAt] = useState(() => {
        const key = "shiftSessionStart:tenant";
        const existing = localStorage.getItem(key);
        if (existing) return existing;
        const created = new Date().toISOString();
        localStorage.setItem(key, created);
        return created;
    });
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
    const [reviewData, setReviewData] = useState(null);
    const [transferApplicant, setTransferApplicant] = useState(null);

    const [viewRow, setViewRow] = useState(null);
    const [contractRow, setContractRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteRemarks, setDeleteRemarks] = useState("");
    const [messagingRow, setMessagingRow] = useState(null);
    const [archiveRow, setArchiveRow] = useState(null);
    const [operationRow, setOperationRow] = useState(null);
    const [toggleOpRow, setToggleOpRow] = useState(null);

    const [emailBody, setEmailBody] = useState("");

    const getRangeBounds = (type, date) => {
        if (type === "All") return { start: null, end: null };
        const start = new Date(date);
        const end = new Date(date);

        if (type === "Daily") {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (type === "Week") {
            const day = start.getDay(); 
            const diff = start.getDate() - day;
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end.setDate(diff + 6);
            end.setHours(23, 59, 59, 999);
        } else if (type === "Month") {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0); 
            end.setHours(23, 59, 59, 999);
        } else if (type === "Year") {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);
        }
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
        setCurrentDateRange(newDate);
        setCurrentPage(1);
    };

    const handleNextPeriod = () => {
        if (dateFilterType === "All") return;
        const newDate = new Date(currentDateRange);
        if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() + 1);
        else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() + 7);
        else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() + 1);
        else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDateRange(newDate);
        setCurrentPage(1);
    };

    const getPeriodDisplayStr = () => {
        if (dateFilterType === "All") return "All Time";
        const { start, end } = getRangeBounds(dateFilterType, currentDateRange);
        if (dateFilterType === "Daily") {
            return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        } else if (dateFilterType === "Week") {
            const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return `${startStr} - ${endStr}`;
        } else if (dateFilterType === "Month") {
            return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } else if (dateFilterType === "Year") {
            return start.getFullYear().toString();
        }
    };

    const [notifyDraft, setNotifyDraft] = useState({
        title: "",
        message: "",
        targetGroup: "All",
        dueDate: "",
        scheduleTime: "",
        isScheduled: false,
        attachment: null,
        templateApplied: false
    });

    const [notificationState, setNotificationState] = useState({
        isOpen: false,
        type: '',
        message: '',
        autoClose: true,
        duration: 3000
    });

    useEffect(() => {
        const fetchDefaultNightPrice = async () => {
            try {
                const response = await fetch(`${API_URL}/tenants/night-market/default-price`);
                if (response.ok) {
                    const data = await response.json();
                    setDefaultNightPrice(data.defaultPrice);
                    setDefaultNightWeeklyRent(Number(data.weeklyRent || Number(data.defaultPrice || 150) * 7));
                    localStorage.setItem("defaultNightPrice", data.defaultPrice.toString());
                    localStorage.setItem("defaultNightWeeklyRent", Number(data.weeklyRent || Number(data.defaultPrice || 150) * 7).toString());
                }
            } catch (error) {
                console.error("Error fetching default night price:", error);
                const saved = localStorage.getItem("defaultNightPrice");
                if (saved) setDefaultNightPrice(Number(saved));
                const savedWeeklyRent = localStorage.getItem("defaultNightWeeklyRent");
                if (savedWeeklyRent) {
                    setDefaultNightWeeklyRent(Number(savedWeeklyRent));
                } else if (saved) {
                    setDefaultNightWeeklyRent(Number(saved) * 7);
                }
            }
        };

        const fetchDefaultPermanentPrice = async () => {
            try {
                const response = await fetch(`${API_URL}/tenants/permanent/default-price`);
                if (response.ok) {
                    const data = await response.json();
                    setDefaultPermanentPrice(data.defaultPrice);
                    localStorage.setItem("defaultPermanentPrice", data.defaultPrice.toString());
                }
            } catch (error) {
                console.error("Error fetching default permanent price:", error);
                const saved = localStorage.getItem("defaultPermanentPrice");
                if (saved) setDefaultPermanentPrice(Number(saved));
            }
        };

        const fetchOverdueSettings = async () => {
            try {
                const response = await fetch(`${API_URL}/tenants/overdue-settings`);
                if (response.ok) {
                    const data = await response.json();
                    setPermChargePct(data.permanentCharge);
                    setPermInterestPct(data.permanentInterest);
                    setNightChargePct(data.nightMarketCharge);
                    setNightInterestPct(data.nightMarketInterest);
                    setNightMaxTerminationDays(data.nightMarketMaxTerminationDays || 3);
                    if (data.permanentDueDate !== undefined) setDefaultDueDate(data.permanentDueDate.toString());
                    if (data.dailyFee !== undefined) setDefaultDailyFee(Number(data.dailyFee));
                }
            } catch (error) {
                console.error("Error fetching overdue settings:", error);
            }
        };

        fetchDefaultNightPrice();
        fetchDefaultPermanentPrice();
        fetchOverdueSettings(); 
    }, []);

    const handleSetPrice = async () => {
        const isNightMarket = activeTab === "night";
        const currentBasePriceInput = isNightMarket ? newNightPrice : newPermanentPrice;
        const currentNightWeeklyRentInput = newNightWeeklyRent;

        if (!currentBasePriceInput || isNaN(currentBasePriceInput)) {
            setNotificationState({ isOpen: true, type: 'error', message: "Please enter a valid price.", autoClose: true, duration: 3000 });
            return;
        }

        const basePriceValue = Number(currentBasePriceInput);
        if (basePriceValue <= 0) {
            setNotificationState({ isOpen: true, type: 'error', message: "Price must be greater than 0.", autoClose: true, duration: 3000 });
            return;
        }

        const weeklyRentValue = isNightMarket ? Number(currentNightWeeklyRentInput) : null;
        if (isNightMarket && (!currentNightWeeklyRentInput || !Number.isFinite(weeklyRentValue) || weeklyRentValue <= 0)) {
            setNotificationState({ isOpen: true, type: 'error', message: "Please enter a valid Night Market weekly rent greater than 0.", autoClose: true, duration: 3000 });
            return;
        }

        if (!isNightMarket) {
            const dailyFeeValue = Number(newDailyFee || defaultDailyFee);
            if (!Number.isFinite(dailyFeeValue) || dailyFeeValue <= 0) {
                setNotificationState({ isOpen: true, type: 'error', message: "Please enter a valid Daily Fee greater than 0.", autoClose: true, duration: 3000 });
                return;
            }
        } else {
            const maxTerminationDays = Number(newNightMaxTerminationDays || nightMaxTerminationDays);
            if (!Number.isFinite(maxTerminationDays) || maxTerminationDays < 1) {
                setNotificationState({ isOpen: true, type: 'error', message: "Please enter a valid Max Days Before Termination (minimum 1 day).", autoClose: true, duration: 3000 });
                return;
            }
        }

        setIsSettingPrice(true);

        try {
            
            const endpoint = isNightMarket ? '/tenants/update-night-market-prices' : '/tenants/update-permanent-prices';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isNightMarket
                        ? {
                            newPrice: basePriceValue,
                            newBasePrice: basePriceValue,
                            newWeeklyRent: weeklyRentValue,
                        }
                        : { newPrice: basePriceValue }
                ),
            });

            if (!response.ok) throw new Error("Failed to update rent prices");
            const result = await response.json();

            const overdueResponse = await fetch(`${API_URL}/tenants/update-overdue-settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    tenantType: isNightMarket ? "Night Market" : "Permanent",
                    chargePercentage: newChargePct ? Number(newChargePct) : (isNightMarket ? nightChargePct : permChargePct), 
                    interestPercentage: newInterestPct ? Number(newInterestPct) : (isNightMarket ? nightInterestPct : permInterestPct),
                    nightMarketMaxTerminationDays: isNightMarket ? Number(newNightMaxTerminationDays || nightMaxTerminationDays) : undefined,
                    permanentDueDate: (!isNightMarket && newDueDate) ? Number(newDueDate) : Number(defaultDueDate),
                    dailyFee: !isNightMarket ? Number(newDailyFee || defaultDailyFee) : undefined,
                }),
            });

            if (!overdueResponse.ok) throw new Error("Failed to update overdue settings");

            if (isNightMarket) {
                setDefaultNightPrice(basePriceValue);
                setDefaultNightWeeklyRent(weeklyRentValue);
                setNightChargePct(newChargePct ? Number(newChargePct) : nightChargePct);
                setNightInterestPct(newInterestPct ? Number(newInterestPct) : nightInterestPct);
                setNightMaxTerminationDays(Number(newNightMaxTerminationDays || nightMaxTerminationDays));
                localStorage.setItem("defaultNightPrice", basePriceValue.toString());
                localStorage.setItem("defaultNightWeeklyRent", weeklyRentValue.toString());
            } else {
                setDefaultPermanentPrice(basePriceValue);
                setPermChargePct(newChargePct ? Number(newChargePct) : permChargePct);
                setPermInterestPct(newInterestPct ? Number(newInterestPct) : permInterestPct);
                setDefaultDueDate(newDueDate ? newDueDate : defaultDueDate);
                setDefaultDailyFee(Number(newDailyFee || defaultDailyFee));
                localStorage.setItem("defaultPermanentPrice", basePriceValue.toString());
            }

            await fetchTenants();

            await logActivity(
                role,
                "SET_FEES_AND_PENALTIES",
                isNightMarket
                    ? `Updated Night Market base price to ₱${basePriceValue} and weekly rent to ₱${weeklyRentValue}.`
                    : `Updated Permanent rent to ₱${basePriceValue} and adjusted overdue settings.`,
                "Tenants",
            );

            setShowSetPriceModal(false);

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: `Prices and Overdue Settings updated successfully!`,
                autoClose: true,
                duration: 4000
            });
        } catch (err) {
            console.error(err);
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to set price: " + err.message, autoClose: true, duration: 3000 });
        } finally {
            setIsSettingPrice(false);
        }
    };

    useEffect(() => {
        fetchTenants();
        fetchWaitlist();
        fetchCollectors();

        const interval = setInterval(() => {
            fetchTenants();
            fetchWaitlist();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (notificationState.isOpen && notificationState.autoClose) {
            const timerDuration = notificationState.duration || 3000;
            const timer = setTimeout(() => {
                setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 });
            }, timerDuration);
            return () => clearTimeout(timer);
        }
    }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]);

   const fetchTenants = async () => {
        try {
           
            const res = await fetch(`${API_URL}/tenants?all=true`);
            if (!res.ok) throw new Error("Failed to fetch tenants");
            const data = await res.json();
            const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
            const normalized = formatted.map((tenant) => {
                const tenantType = tenant.tenantType || "Permanent";
                const isStartRequiredType = tenantType === "Permanent" || tenantType === "Night Market";
                if (isStartRequiredType && !tenant.operationStartDate) {
                    return {
                        ...tenant,
                        rentAmount: 0,
                        totalAmount: 0,
                        DueDateTime: null,
                        status: "Not Started Operations",
                    };
                }
                return tenant;
            });
            normalized.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            
            setAllTenantRecords(normalized);
            
            setRecords(normalized.filter(t => !t.isArchived && !t.isDeleted));
        } catch (err) {
            console.error("Error fetching tenants:", err);
        }
    };

    const fetchCollectors = async () => {
        try {
            const res = await fetch(`${API_URL}/collectors?active=true&department=Tenant`);
            if (!res.ok) throw new Error("Failed to fetch collectors");
            const data = await res.json();
            setCollectors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching tenant collectors:", error);
        }
    };

    const fetchDeleteRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/deletion-requests`);
            if (!res.ok) return;

            const data = await res.json();
            const requestedIds = (Array.isArray(data) ? data : [])
                .filter((request) => (request?.status || "pending") === "pending")
                .filter((request) => request?.itemType === "Tenant Lease")
                .map((request) => request?.originalData?._id || request?.originalData?.id)
                .filter(Boolean)
                .map(String);

            setDeleteRequestIds(requestedIds);
        } catch (error) {
            console.error("Error fetching deletion requests:", error);
        }
    };

    const fetchPreviousShiftReports = async () => {
        if (role !== "lease") return;
        setIsPreviousShiftLoading(true);
        try {
            const res = await fetch(REPORTS_API_URL);
            if (!res.ok) throw new Error("Failed to load reports.");
            const data = await res.json();

            const ownReports = (Array.isArray(data) ? data : [])
                .filter((report) => {
                    const reportType = report?.reportType || report?.data?.reportType || "";
                    if (reportType !== "Tenant") return false;

                    const reportAdminId = report?.data?.adminId;
                    const reportEmail = String(report?.data?.submittedByEmail || "").toLowerCase();

                    if (authAdminId && reportAdminId) {
                        return String(reportAdminId) === String(authAdminId);
                            fetchDeleteRequests();
                    }
                    if (authEmail && reportEmail) {
                        return reportEmail === authEmail;
                    }
                    return true;
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
                type: 'error',
                message: error.message || 'Failed to fetch previous shift reports.',
                autoClose: true,
                duration: 3000,
            });
        } finally {
            setIsPreviousShiftLoading(false);
        }
    };

    const fetchWaitlist = async () => {
        try {
            const res = await fetch(`${API_URL}/waitlist`);
            if (!res.ok) throw new Error("Failed to fetch waitlist");
            const data = await res.json();
            const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
            
            const activeWaitlist = formatted.filter(app => 
                app.status !== 'TENANT' && 
                app.status !== 'MOVED OUT' && 
                app.status !== 'MOVED_OUT'
            );
           
            setWaitlistData(activeWaitlist);
            if (reviewData) {
                const updatedRecord = activeWaitlist.find(r => r.id === reviewData.id);
                if (updatedRecord) setReviewData(updatedRecord);
            }
        } catch (err) {
            console.error("Error fetching waitlist:", err);
        }
    };

    useEffect(() => {
        const newAlerts = [];
        records.forEach(t => {
            if (t.DueDateTime) {
                const diff = Math.ceil((new Date(t.DueDateTime) - new Date()) / (1000 * 60 * 60 * 24));
                if (diff > 0 && diff <= 30) {
                    newAlerts.push({ id: t.id, type: "renewal", msg: `Renewal Warning: ${t.tenantName} (Slot ${t.slotNo}) expires in ${diff} days.` });
                }
            }
        });
        setAlerts(newAlerts);
    }, [records]);

    const addImageToWorksheet = async (workbook, worksheet, imageSrc, range) => {
        if (!imageSrc) return;
        try {
            const response = await fetch(imageSrc);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const imageId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
            });

            worksheet.addImage(imageId, range);
        } catch (error) {
            console.error("Tenant branding image error:", error);
        }
    };

    const filtered = records.filter((t) => {
        const name = t.tenantName || t.name || "";
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.referenceNo || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "permanent" ? (t.tenantType === "Permanent" || !t.tenantType) : t.tenantType === "Night Market";
        const matchesStatus = activeStatus === "All" || t.status.toLowerCase() === activeStatus.toLowerCase();

        const tenantDate = t.StartDateTime ? new Date(t.StartDateTime) : null;
        let matchesDateRange = false;

        if (dateFilterType === "All") {
            matchesDateRange = true;
        } else if (tenantDate && !Number.isNaN(tenantDate.getTime())) {
            matchesDateRange = tenantDate >= filterStart && tenantDate <= filterEnd;
        }

        return matchesSearch && matchesTab && matchesStatus && matchesDateRange;
    });

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const mapStats = useMemo(() => {
        let available = 0; let paid = 0; let revenue = 0;
        let totalSlots = 0;
        let slotLabels = [];

        if (activeTab === "permanent") {
            totalSlots = 30;
            for (let i = 0; i < totalSlots; i++) {
                slotLabels.push(`A-${101 + i}`);
            }
        } else {
            totalSlots = 64;
            for (let i = 1; i <= totalSlots; i++) {
                slotLabels.push(`NM-${i.toString().padStart(2, '0')}`);
            }
        }

        const countedTenantIds = new Set();

        slotLabels.forEach(slotLabel => {
            const tenant = records.find(r =>
                (r.slotNo === slotLabel || r.slotno === slotLabel || (r.slotNo && r.slotNo.includes(slotLabel))) &&
                (activeTab === "permanent" ? (r.tenantType === "Permanent" || !r.tenantType) : r.tenantType === "Night Market")
            );

            if (tenant && tenant.status !== "Available") {
                paid++;

                const tenantId = tenant._id || tenant.id;
                if (!countedTenantIds.has(tenantId)) {
                    countedTenantIds.add(tenantId);
                    revenue += (parseFloat(tenant.rentAmount) || 0) + (parseFloat(tenant.utilityAmount) || 0);
                }
            } else {
                available++;
            }
        });

        return { availableSlots: available, nonAvailableSlots: paid, totalSlots: totalSlots, totalRevenue: revenue };
    }, [records, activeTab]);


   const { dateRange, filteredPayments } = useMemo(() => {
        let all = [];
        records.forEach(t => {
            if (t.paymentHistory && Array.isArray(t.paymentHistory)) {
                t.paymentHistory.forEach(p => {
                    all.push({
                        ...p,
                        tenantName: t.tenantName || t.name,
                        slotNo: t.slotNo,
                        tenantType: t.tenantType || "Permanent",
                        status: t.status,
                        isDeleted: t.isDeleted
                    });
                });
            }
        });

        all.sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid));

        const defaultStart = new Date(paymentRefDate);
        const defaultEnd = new Date(paymentRefDate);

        if (paymentViewType === "Week") {
            const day = defaultStart.getDay();
            defaultStart.setDate(defaultStart.getDate() - day);
            defaultEnd.setDate(defaultStart.getDate() + 6);
        } else if (paymentViewType === "Month") {
            defaultStart.setDate(1);
            defaultEnd.setMonth(defaultEnd.getMonth() + 1, 0);
        } else if (paymentViewType === "Year") {
            defaultStart.setMonth(0, 1);
            defaultEnd.setMonth(11, 31);
        }

        defaultStart.setHours(0, 0, 0, 0);
        defaultEnd.setHours(23, 59, 59, 999);

        const start = defaultStart;
        const end = defaultEnd;

        const filtered = all.filter(p => {
            const pDate = new Date(p.datePaid);
            const isWithinDate = pDate >= start && pDate <= end;
            const isTypeMatch = p.tenantType === paymentTenantTab;
            return isWithinDate && isTypeMatch;
        });

        return { dateRange: { start, end }, filteredPayments: filtered };
    }, [records, paymentViewType, paymentRefDate, paymentTenantTab]);

    const handleShiftDate = (direction) => {
        setPaymentRefDate(prev => {
            const nextDate = new Date(prev);
            if (paymentViewType === "Week") nextDate.setDate(nextDate.getDate() + (direction * 7));
            else if (paymentViewType === "Month") nextDate.setMonth(nextDate.getMonth() + direction);
            else if (paymentViewType === "Year") nextDate.setFullYear(nextDate.getFullYear() + direction);
            return nextDate;
        });
    };

    const getDisplayRangeText = () => {
        const { start, end } = dateRange;
        if (paymentViewType === "Week") {
            const sMonth = start.toLocaleString('en-US', { month: 'short' });
            const eMonth = end.toLocaleString('en-US', { month: 'short' });
            if (start.getFullYear() !== end.getFullYear()) return `${sMonth} ${start.getDate()}, ${start.getFullYear()} - ${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
            if (sMonth === eMonth) return `${sMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
            return `${sMonth} ${start.getDate()} - ${eMonth} ${end.getDate()}, ${start.getFullYear()}`;
        } else if (paymentViewType === "Month") {
            return start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        } else if (paymentViewType === "Year") {
            return start.getFullYear().toString();
        }
    };

    const totalCollected = useMemo(() => {
        return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }, [filteredPayments]);

    const uniquePayingTenants = useMemo(() => {
        return new Set(
            filteredPayments.map((payment) => `${payment.tenantName || ""}|||${payment.slotNo || ""}`),
        ).size;
    }, [filteredPayments]);

    const paymentTenantOptions = useMemo(() => {
        const tenantMap = new globalThis.Map();

        records
            .filter((tenant) => {
                return (tenant.tenantType || "Permanent") === paymentTenantTab;
            })
            .forEach((tenant) => {
                const rawId = tenant._id || tenant.id || tenant.referenceNo || `${tenant.tenantName || tenant.name}-${tenant.slotNo || "slot"}`;
                const stableId = String(rawId);
                if (!tenantMap.has(stableId)) {
                    tenantMap.set(stableId, tenant);
                }
            });

        return Array.from(tenantMap.entries()).map(([id, tenant]) => ({ id, tenant }));
    }, [records, paymentTenantTab]);

    useEffect(() => {
        if (paymentTenantOptions.length === 0) {
            setSelectedPaymentTenantId("");
            return;
        }

        setSelectedPaymentTenantId((prev) => {
            if (paymentTenantOptions.some((item) => item.id === prev)) return prev;
            return paymentTenantOptions[0].id;
        });
    }, [paymentTenantOptions]);

    const selectedPaymentTenant = useMemo(() => {
        if (!selectedPaymentTenantId) return null;
        return paymentTenantOptions.find((item) => item.id === selectedPaymentTenantId)?.tenant || null;
    }, [paymentTenantOptions, selectedPaymentTenantId]);

    const paymentProgress = useMemo(() => {
        if (!selectedPaymentTenant) return null;

        const toValidDate = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const startOfDay = (date) => {
            const next = new Date(date);
            next.setHours(0, 0, 0, 0);
            return next;
        };

        const addMonths = (date, months) => {
            const next = new Date(date);
            next.setMonth(next.getMonth() + months);
            return next;
        };

        const addDays = (date, days) => {
            const next = new Date(date);
            next.setDate(next.getDate() + days);
            return next;
        };

        const withDayInMonth = (baseDate, targetDay) => {
            const next = new Date(baseDate);
            const safeDay = Math.max(1, Number(targetDay) || 1);
            const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
            next.setDate(Math.min(safeDay, daysInMonth));
            return next;
        };

        const getActiveContract = (tenant) => {
            const contracts = Array.isArray(tenant.contracts) ? tenant.contracts : [];
            if (contracts.length === 0) return null;

            const byId = tenant.activeContractId
                ? contracts.find((contract) => String(contract._id) === String(tenant.activeContractId))
                : null;

            const byStatus = contracts.find((contract) => contract.status === "active");
            return byId || byStatus || contracts[contracts.length - 1];
        };

        const activeContract = getActiveContract(selectedPaymentTenant);

        const contractStart =
            toValidDate(activeContract?.startDate) ||
            toValidDate(selectedPaymentTenant.StartDateTime) ||
            toValidDate(selectedPaymentTenant.createdAt) ||
            new Date();

        let contractEnd =
            toValidDate(activeContract?.endDate) ||
            toValidDate(selectedPaymentTenant.DueDateTime);

        if (!contractEnd) {
            const durationFromContract = Number(activeContract?.durationMonths) || 0;
            const fallbackDuration = durationFromContract > 0 ? durationFromContract : 12;
            contractEnd = addMonths(contractStart, fallbackDuration);
        }

        if (contractEnd <= contractStart) {
            contractEnd = addMonths(contractStart, 1);
        }

        const slotCount = selectedPaymentTenant.slotNo ? String(selectedPaymentTenant.slotNo).split(",").length : 1;
        const utilityAmount = Number(selectedPaymentTenant.utilityAmount) || 0;
        const currentOutstandingAmount = Number(selectedPaymentTenant.totalAmount || selectedPaymentTenant.rentAmount || 0);
        const isNightMarketTenant = selectedPaymentTenant.tenantType === "Night Market";
        const configuredRecurringRate = isNightMarketTenant ? Number(defaultNightWeeklyRent || 1050) : Number(defaultPermanentPrice || 6000);
        const futureRentAmount = configuredRecurringRate * slotCount;
        const monthlyCharge = futureRentAmount + utilityAmount;
        const hasUnpaidCurrentCycle = String(selectedPaymentTenant.status || "").toLowerCase() !== "paid";

        const isPermanentTenant = !isNightMarketTenant;
        if (isPermanentTenant) {
            const dueDay = Math.max(1, Math.min(31, Number(defaultDueDate) || 5));
            const dailyFee = Math.max(0, Number(defaultDailyFee) || 200);

            const operationStartDate = toValidDate(selectedPaymentTenant.operationStartDate);
            const billingStartDate = operationStartDate ? addDays(startOfDay(operationStartDate), 1) : null;

            let firstDueDate = null;
            if (billingStartDate) {
                firstDueDate = withDayInMonth(billingStartDate, dueDay);
                if (firstDueDate < billingStartDate) {
                    firstDueDate = withDayInMonth(addMonths(billingStartDate, 1), dueDay);
                }
            }

            const fallbackAnchorBase = billingStartDate || contractStart;
            let dueAnchor = firstDueDate;
            if (!dueAnchor) {
                dueAnchor = withDayInMonth(fallbackAnchorBase, dueDay);
                if (dueAnchor < fallbackAnchorBase) {
                    dueAnchor = withDayInMonth(addMonths(fallbackAnchorBase, 1), dueDay);
                }
            }
            const cycleDueDates = [];
            for (
                let cursor = new Date(dueAnchor), guard = 0;
                cursor <= contractEnd && guard < 240;
                cursor = withDayInMonth(addMonths(cursor, 1), dueDay), guard += 1
            ) {
                cycleDueDates.push(new Date(cursor));
            }
            if (cycleDueDates.length === 0) {
                cycleDueDates.push(new Date(dueAnchor));
            }

            let firstCycleAmount = monthlyCharge;
            let firstCycleIsProrated = false;
            if (billingStartDate && firstDueDate) {
                const dayMs = 24 * 60 * 60 * 1000;
                const dayDiff = Math.floor((startOfDay(firstDueDate).getTime() - startOfDay(billingStartDate).getTime()) / dayMs);
                const billableDays = Math.max(0, dayDiff + 1);
                const proratedRent = dailyFee * Math.max(1, slotCount) * billableDays;
                firstCycleAmount = proratedRent + utilityAmount;
                firstCycleIsProrated = true;
            }

            const allPayments = [...(selectedPaymentTenant.paymentHistory || [])].sort(
                (a, b) => new Date(a?.datePaid || 0).getTime() - new Date(b?.datePaid || 0).getTime(),
            );

            const advancePayments = [];
            const cyclePayments = [];
            allPayments.forEach((entry) => {
                const paidAt = toValidDate(entry?.datePaid);
                if (!paidAt) return;

                const ref = String(entry?.referenceNo || "").trim().toLowerCase();
                const coverageEnd = toValidDate(entry?.coverageEndDate);

                const looksInitial = ref === "initial payment" || ref.includes("initial");
                const paidBeforeBilling = billingStartDate ? paidAt < billingStartDate : false;
                const coverageBeforeBilling = billingStartDate && coverageEnd ? coverageEnd <= billingStartDate : false;

                if (looksInitial || paidBeforeBilling || coverageBeforeBilling) {
                    advancePayments.push(entry);
                    return;
                }

                cyclePayments.push(entry);
            });

            const timeline = cycleDueDates.map((dueDate, index) => {
                const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
                const label = `${dueDate.toLocaleString("en-US", { month: "short" }).toUpperCase()} ${dueDate.getDate()}`;
                const paymentEntry = cyclePayments[index] || null;
                const expectedDueAmount = index === 0 ? firstCycleAmount : monthlyCharge;

                if (paymentEntry) {
                    const paidAmount = Number(paymentEntry.amount) || 0;
                    return {
                        label,
                        key,
                        paidAmount,
                        dueAmount: 0,
                        status: "paid",
                    };
                }

                let dueAmount = expectedDueAmount;
                if (index === cyclePayments.length && hasUnpaidCurrentCycle) {
                    dueAmount = currentOutstandingAmount || expectedDueAmount;
                }

                const status = startOfDay(dueDate) < startOfDay(new Date()) ? "overdue" : "remaining";

                return {
                    label,
                    key,
                    paidAmount: 0,
                    dueAmount,
                    status,
                };
            });

            const totalMonths = timeline.length;
            const paidMonths = timeline.filter((month) => month.status === "paid").length;
            const remainingMonths = timeline.filter((month) => month.status === "remaining").length;
            const overdueMonths = timeline.filter((month) => month.status === "overdue").length;

            const advancePaidAmount = advancePayments.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
            const paidAmount = timeline
                .filter((month) => month.status === "paid")
                .reduce((sum, month) => sum + (Number(month.paidAmount) || 0), 0) + advancePaidAmount;
            const remainingAmount = timeline
                .filter((month) => month.status === "remaining" || month.status === "overdue")
                .reduce((sum, month) => sum + (Number(month.dueAmount) || 0), 0);
            const projectedAmount = paidAmount + remainingAmount;
            const progressPercent = totalMonths > 0 ? Math.round((paidMonths / totalMonths) * 100) : 0;

            return {
                timeline,
                totalMonths,
                paidMonths,
                remainingMonths,
                overdueMonths,
                paidAmount,
                projectedAmount,
                remainingAmount,
                progressPercent,
                monthlyCharge,
                currentCycleAmount: hasUnpaidCurrentCycle ? currentOutstandingAmount : 0,
                contractPeriodLabel: `${contractStart.toLocaleDateString()} - ${contractEnd.toLocaleDateString()}`,
                fixedDueDay: dueDay,
                firstCycleAmount,
                firstCycleIsProrated,
                advancePaidAmount,
            };
        }

        const timelineStart = new Date(contractStart.getFullYear(), contractStart.getMonth(), 1);
        const timelineEnd = new Date(contractEnd.getFullYear(), contractEnd.getMonth(), 1);

        const contractMonths = [];
        for (let cursor = new Date(timelineStart); cursor <= timelineEnd; cursor = addMonths(cursor, 1)) {
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
            const label = cursor.toLocaleString("en-US", { month: "short", year: "2-digit" }).toUpperCase();
            contractMonths.push({ key, label, monthStart: new Date(cursor) });
        }

        const paidByMonth = new globalThis.Map();
        (selectedPaymentTenant.paymentHistory || []).forEach((entry) => {
            const paidAt = toValidDate(entry?.datePaid);
            if (!paidAt) return;

            const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
            if (!contractMonths.some((month) => month.key === key)) return;

            paidByMonth.set(key, (paidByMonth.get(key) || 0) + (Number(entry.amount) || 0));
        });

        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const timeline = contractMonths.map((month) => {
            const paidAmount = paidByMonth.get(month.key) || 0;
            const isPaid = paidAmount > 0;
            const isPastMonth = month.monthStart < currentMonthStart;
            const isCurrentMonth =
                month.monthStart.getFullYear() === currentMonthStart.getFullYear() &&
                month.monthStart.getMonth() === currentMonthStart.getMonth();

            let status = "remaining";
            if (isPaid) {
                status = "paid";
            } else if (isPastMonth) {
                status = "overdue";
            }

            let dueAmount = monthlyCharge;
            if (isCurrentMonth && hasUnpaidCurrentCycle) {
                dueAmount = currentOutstandingAmount || monthlyCharge;
            }

            if (status === "paid") {
                dueAmount = 0;
            }

            return {
                label: month.label,
                key: month.key,
                paidAmount,
                dueAmount,
                status,
            };
        });

        const totalMonths = timeline.length;
        const paidMonths = timeline.filter((m) => m.status === "paid").length;
        const remainingMonths = timeline.filter((m) => m.status === "remaining").length;
        const overdueMonths = timeline.filter((m) => m.status === "overdue").length;

        const paidAmount = Array.from(paidByMonth.values()).reduce((sum, value) => sum + value, 0);
        const remainingAmount = timeline
            .filter((m) => m.status === "remaining" || m.status === "overdue")
            .reduce((sum, m) => sum + (Number(m.dueAmount) || 0), 0);
        const projectedAmount = paidAmount + remainingAmount;
        const progressPercent = totalMonths > 0 ? Math.round((paidMonths / totalMonths) * 100) : 0;

        return {
            timeline,
            totalMonths,
            paidMonths,
            remainingMonths,
            overdueMonths,
            paidAmount,
            projectedAmount,
            remainingAmount,
            progressPercent,
            monthlyCharge,
            currentCycleAmount: hasUnpaidCurrentCycle ? currentOutstandingAmount : 0,
            contractPeriodLabel: `${contractStart.toLocaleDateString()} - ${contractEnd.toLocaleDateString()}`,
        };
    }, [selectedPaymentTenant, defaultNightWeeklyRent, defaultPermanentPrice, defaultDueDate, defaultDailyFee]);

    const paginatedPayments = useMemo(() => {
        const start = (paymentCurrentPage - 1) * paymentItemsPerPage;
        return filteredPayments.slice(start, start + paymentItemsPerPage);
    }, [filteredPayments, paymentCurrentPage, paymentItemsPerPage]);

   
    useEffect(() => {
        setPaymentCurrentPage(1);
    }, [paymentViewType, paymentRefDate, paymentTenantTab]);
   
    const validateCollector = () => {
        if (role === "superadmin") {
            return true;
        }
        if (!collectorName || collectorName.trim() === "") {
            setNotificationState({
                isOpen: true,
                type: "error",
                message: "Please enter the Name of Collector before exporting.",
                autoClose: true,
                duration: 3000,
            });
            return false;
        }
        return true;
    };

    const isTenantPendingForShift = (tenant, shiftStartDate) => {
        const createdAt = tenant?.createdAt ? new Date(tenant.createdAt) : null;
        const updatedAt = tenant?.updatedAt ? new Date(tenant.updatedAt) : null;
        const submittedAt = tenant?.submittedAt ? new Date(tenant.submittedAt) : null;

        const hasCreatedAt = createdAt && !Number.isNaN(createdAt.getTime());
        const hasUpdatedAt = updatedAt && !Number.isNaN(updatedAt.getTime());

        const latestActivity = hasUpdatedAt
            ? updatedAt
            : hasCreatedAt
                ? createdAt
                : null;

        if (!latestActivity || latestActivity < shiftStartDate) {
            return false;
        }

        if (!submittedAt || Number.isNaN(submittedAt.getTime())) {
            return true;
        }

        return submittedAt < shiftStartDate;
    };

    const shiftRecords = useMemo(() => {
        const shiftStartDate = new Date(sessionStartedAt);
        if (Number.isNaN(shiftStartDate.getTime())) return [];

        return records.filter((tenant) => {
            if (tenant?.isArchived || tenant?.isDeleted) return false;
            return isTenantPendingForShift(tenant, shiftStartDate);
        });
    }, [records, sessionStartedAt]);

    const handleOpenSubmitModal = () => {
        setShowSubmitModal(true);
    };

    const handleSubmitReport = async () => {
        if (!collectorName.trim() || !collectorId) {
            setNotificationState({
                isOpen: true,
                type: "error",
                message: "Please select a collector before submitting report.",
                autoClose: true,
                duration: 3000,
            });
            return;
        }

        if (shiftRecords.length === 0) {
            setNotificationState({
                isOpen: true,
                type: "error",
                message: "No new tenant transactions in the current shift to submit.",
                autoClose: true,
                duration: 3000,
            });
            return;
        }

        setIsReporting(true);
        try {
            const formattedData = shiftRecords.map(t => ({
                "Slot": t.slotNo,
                "Name": t.tenantName || t.name,
                "Type": t.tenantType || "Permanent",
                "Contact": t.contactNo || "-",
                "Status": t.status,
                "Start Date": formatDate(t.StartDateTime),
                "Due Date": formatDate(t.DueDateTime || t.EndDateTime),
                "Rent": t.rentAmount || 0,
                "Utility": t.utilityAmount || 0,
                "Total Due": t.totalAmount || calculateDueAmount(t)
            }));

            const adminName = localStorage.getItem("authName") || localStorage.getItem("authEmail") || (role === "lease" ? "Tenant Admin" : "Admin");

            const reportPayload = {
                screen: "Tenant Lease Management",
                generatedDate: new Date().toLocaleString(),
                assignedShift: assignedShiftValue || "No assigned shift",
                sessionStartedAt,
                filters: {
                    searchQuery,
                    activeTab,
                    activeStatus,
                    dateFilter: getPeriodDisplayStr(), 
                    duration: dateFilterType,          
                },
                statistics: {
                    totalRecords: records.length,
                    submittedShiftRecords: shiftRecords.length,
                    totalRevenue: mapStats.totalRevenue,
                    occupancy: `${mapStats.nonAvailableSlots}/${mapStats.totalSlots}`,
                    collector: collectorName.trim(),
                    collectorId,
                },
                data: formattedData
            };

            const report = await submitPageReport("Tenant Lease", reportPayload, adminName, {
                reportType: "Tenant",
                payload: reportPayload,
            });

            const submitShiftRes = await fetch(`${API_URL}/tenants/submit-shift`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionStartedAt,
                    reportId: report?._id || report?.id || null,
                }),
            });

            if (!submitShiftRes.ok) {
                throw new Error("Report created, but failed to mark tenant shift records as submitted.");
            }

            await sendNotification(
                "Report Submitted: Tenant Lease",
                `A Tenant Lease report was submitted by ${role === 'lease' ? 'Tenant Admin' : 'Admin'}. Shift transactions are officially logged and tenant records remain visible on dashboard.`,
                "Tenants",
                "superadmin"
            );

            await logActivity(role, "SUBMIT_REPORT", "Submitted Tenant Lease Report", "Tenants");

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: "Report submitted successfully! Tenant records remain visible for continuity.",
                autoClose: true,
                duration: 3000
            });

            setShowSubmitModal(false);
            setSessionStartedAt(new Date().toISOString());
            setCollectorId("");
            setCollectorName("");
            await fetchTenants();

        } catch (error) {
            console.error("Report Error:", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Failed to submit report.",
                autoClose: true,
                duration: 3000
            });
        } finally {
            setIsReporting(false);
        }
    };

    const handleCollectorSelection = (nextCollectorId, selectedCollector) => {
        setCollectorId(nextCollectorId);
        if (!selectedCollector) {
            setCollectorName("");
            return;
        }

        const middleInitial = selectedCollector.middleName
            ? `${String(selectedCollector.middleName).trim().charAt(0).toUpperCase()}.`
            : "";

        const displayName = [
            selectedCollector.firstName,
            middleInitial,
            selectedCollector.lastName,
            selectedCollector.suffix,
        ]
            .filter(Boolean)
            .join(" ");

        setCollectorName(displayName);
    };

    const toggleSelectionMode = () => {
        if (isSelectionMode) setSelectedIds([]);
        setIsSelectionMode(!isSelectionMode);
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const ids = paginatedData.map(item => item.id);
            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
        } else {
            const pageIds = paginatedData.map(item => item.id);
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

    const handleBulkDelete = async () => {
        const confirmMsg = `Request deletion for ${selectedIds.length} tenants?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            if (role === "lease") {
                await requestBulkDeletion(API_URL, selectedIds, records);
                const newRequestIds = selectedIds.filter(
                    (id) => !deleteRequestIds.includes(String(id)),
                );

                if (newRequestIds.length === 0) {
                    setNotificationState({
                        isOpen: true,
                        type: 'error',
                        message: "Selected tenants already have pending deletion requests.",
                        autoClose: true,
                        duration: 3000,
                    });
                    setSelectedIds([]);
                    setIsSelectionMode(false);
                    return;
                }

                await requestBulkDeletion(API_URL, newRequestIds, records);

                await sendNotification(
                    "Deletion Request: Tenants",
                    `Tenant Admin has requested to delete ${newRequestIds.length} tenant records.`,
                    "Tenants",
                    "superadmin"
                );

                await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${newRequestIds.length} tenants`, "Tenants");

                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: `Sent deletion requests for ${newRequestIds.length} records. Superadmin notified.`,
                    autoClose: true,
                    duration: 3000
                });
                await fetchDeleteRequests();
                setSelectedIds([]);
                setIsSelectionMode(false);
            }
        } catch (error) {
            console.error("Bulk action failed", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Failed to process some records.",
                autoClose: true,
                duration: 3000
            });
        }
    };

    const handleAddToWaitlist = async () => {
        if (!waitlistForm.name || !waitlistForm.contact) {
            setNotificationState({ isOpen: true, type: 'error', message: "Please fill in Name and Contact.", autoClose: true, duration: 3000 });
            return;
        }
        try {
            const payload = {
                ...waitlistForm,
                dateRequested: new Date().toISOString(),
                status: "Pending"
            };
            const response = await fetch(`${API_URL}/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setNotificationState({ isOpen: true, type: 'success', message: "Added to waitlist successfully!", autoClose: true, duration: 3000 });
                await logActivity(role, "ADD_WAITLIST", `Added ${waitlistForm.name} to waitlist`, "Tenants");
                fetchWaitlist();
                setWaitlistForm({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
                setShowWaitlistForm(false);
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to add to waitlist", autoClose: true, duration: 3000 });
            }
        } catch (error) {
            console.error("Waitlist Error:", error);
            setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not add to waitlist.", autoClose: true, duration: 3000 });
        }
    };

    const handleStartApproval = async (applicant) => {
        try {
            document.body.style.cursor = 'wait';
            const res = await fetch(`${API_URL}/waitlist/${applicant.id}`);
            if (!res.ok) throw new Error("Failed to fetch applicant details");

            const fullData = await res.json();
            setReviewData(fullData);
            setShowWaitlistModal(false);
            setShowReviewModal(true);

            setWaitlistData(prev => prev.map(item =>
                (item.id === applicant.id || item._id === applicant.id)
                    ? { ...item, adminViewed: true }
                    : item
            ));

        } catch (error) {
            console.error("Error fetching full details:", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Could not load documents. Please try again.",
                autoClose: true,
                duration: 3000
            });
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const handleUnlockPayment = async () => {
        const idToUpdate = reviewData?.id || reviewData?._id;
        if (!idToUpdate) {
            console.error("Error: No ID found for payment unlock");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/waitlist/${idToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "PAYMENT_UNLOCKED" })
            });
            if (response.ok) {
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Payment Unlocked! The applicant has been notified via email.",
                    autoClose: true,
                    duration: 3000
                });
                await logActivity(role, "UNLOCK_PAYMENT", `Unlocked payment for waitlist applicant ID #${idToUpdate}`, "Tenants");
                setShowReviewModal(false);
                setShowWaitlistModal(true);
                fetchWaitlist();
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to update status.", autoClose: true, duration: 3000 });
            }
        } catch (error) {
            console.error("Error:", error);
            setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not unlock payment.", autoClose: true, duration: 3000 });
        }
    };

    const handleRequestContract = async () => {
        const idToUpdate = reviewData?.id || reviewData?._id;
        if (!idToUpdate) return;

        try {
            const response = await fetch(`${API_URL}/waitlist/${idToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "CONTRACT_PENDING" })
            });
            if (response.ok) {
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Status updated to Contract Pending. Applicant notified via email.",
                    autoClose: true,
                    duration: 3000
                });
                await logActivity(role, "REQUEST_CONTRACT", `Requested contract for waitlist applicant ID #${idToUpdate}`, "Tenants");
                setShowReviewModal(false);
                setShowWaitlistModal(true);
                fetchWaitlist();
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to update status.", autoClose: true, duration: 3000 });
            }
        } catch (error) {
            console.error("Error:", error);
            setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not request contract.", autoClose: true, duration: 3000 });
        }
    };

    const handleProceedToLease = () => {
        setTransferApplicant(reviewData);
        setShowReviewModal(false);
        setShowAddModal(true);
    };

    const handleAddTenant = async (newTenant) => {
        try {
            const waitlistId = transferApplicant?.id || transferApplicant?._id;
            const formData = new FormData();

            Object.keys(newTenant).forEach(key => {
                if (key === 'documents' || key === 'id' || key === '_id') return;
                const value = newTenant[key];
                if (value === undefined || value === null) return;
                if (key === 'reportId' && typeof value === 'string' && !value.trim()) return;
                if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return;
                formData.append(key, value);
            });

            if (waitlistId) {
                formData.append('transferWaitlistId', waitlistId);
            }

            if (newTenant.documents) {
                const docKeys = ['businessPermit', 'validID', 'contract', 'barangayClearance', 'proofOfReceipt', 'communityTax', 'policeClearance'];
                docKeys.forEach(docKey => {
                    const docValue = newTenant.documents[docKey];
                    if (docValue instanceof File) {
                        formData.append(docKey, docValue);
                    } else if (typeof docValue === 'string' && docValue.trim() !== "") {
                        formData.append(docKey, docValue);
                    }
                });
            }

            const response = await fetch(`${API_URL}/tenants`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setShowAddModal(false);
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Tenant Added Successfully! Welcome email sent.",
                    autoClose: true,
                    duration: 3000
                });
                await logActivity(role, "ADD_TENANT", `Added new tenant: ${newTenant.tenantName || newTenant.name || 'Unknown'}`, "Tenants");
                fetchTenants();
                fetchWaitlist();
                setTransferApplicant(null);
            } else {
                const err = await response.json();
                setNotificationState({ isOpen: true, type: 'error', message: `Error saving to database: ${err.error || 'Unknown error'}`, autoClose: true, duration: 3000 });
            }
        } catch (e) {
            console.error(e);
            setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not save tenant.", autoClose: true, duration: 3000 });
        }
    };

   const handleMoveOutSubmit = async (moveOutData) => {
        try {
            const res = await fetch(`${API_URL}/tenants/move-out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moveOutData)
            });
            
            if (res.ok) {
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Tenant successfully moved out! Final accounting email sent.",
                    autoClose: true,
                    duration: 5000
                });
                await logActivity(role, "MOVE_OUT", `Processed move out for tenant in slot ${tenantToMoveOut?.slotNo}`, "Tenants");
                
                setIsMoveOutModalOpen(false);
                setTenantToMoveOut(null);
                fetchTenants(); 
            } else {
                const errData = await res.json();
                setNotificationState({ isOpen: true, type: 'error', message: `Failed: ${errData.error || 'Unknown error'}`, autoClose: true, duration: 4000 });
            }
        } catch (err) {
            setNotificationState({ isOpen: true, type: 'error', message: "Server error processing move out.", autoClose: true, duration: 4000 });
        }
    };

    const handleRejectApplicant = async (id, reason) => {
        try {
            const response = await fetch(`${API_URL}/waitlist/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "REJECTED",
                    rejectionReason: reason
                })
            });

            if (response.ok) {
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Application rejected. The applicant has been notified via email.",
                    autoClose: true,
                    duration: 3000
                });
                await logActivity(role, "REJECT_APPLICANT", `Rejected waitlist applicant ID #${id}. Reason: ${reason}`, "Tenants");

                fetchWaitlist();
                if (showReviewModal) setShowReviewModal(false);
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to reject application.", autoClose: true, duration: 3000 });
            }
        } catch (error) {
            console.error(error);
            setNotificationState({ isOpen: true, type: 'error', message: "Error rejecting application.", autoClose: true, duration: 3000 });
        }
    };

    const handleApproveRenewal = async (tenantId, contractIdArg, reviewTypeArg = "contract") => {
        try {
            const contractId = contractIdArg
                || (Array.isArray(records.find((tenant) => String(tenant.id) === String(tenantId))?.contracts)
                    ? records
                        .find((tenant) => String(tenant.id) === String(tenantId))
                        .contracts
                        .find((contract) => contract.status === 'pending_approval')?._id
                    : null);

            const isPaymentReviewFlow = reviewTypeArg === "payment" || !contractId;

            if (isPaymentReviewFlow) {
                const paymentRes = await fetch(`${API_URL}/tenants/${tenantId}/approve-renewal`, { method: 'PUT' });
                const paymentData = await paymentRes.json();

                if (paymentRes.ok) {
                    setNotificationState({ isOpen: true, type: 'success', message: "Renewal payment confirmed. Next due date updated.", autoClose: true, duration: 3500 });
                    await logActivity(role, "APPROVE_RENEWAL", `Approved renewal payment review for tenant ID #${tenantId}`, "Tenants");
                    setShowReviewModal(false);
                    fetchTenants();
                } else {
                    setNotificationState({ isOpen: true, type: 'error', message: `Failed: ${paymentData.error || 'Unknown error'}`, autoClose: true, duration: 5000 });
                }
                return;
            }

            const res = await fetch(`${API_URL}/tenants/${tenantId}/contracts/${contractId}/approve-renewal-request`, { method: 'PUT' });
            
            const data = await res.json(); 
            
            if (res.ok) {
                setNotificationState({ isOpen: true, type: 'success', message: "Renewal contract approved. It will activate on its scheduled start date.", autoClose: true, duration: 3500 });
            
                await logActivity(role, "APPROVE_RENEWAL", `Approved renewal contract request for tenant ID #${tenantId}`, "Tenants");
            
                setShowReviewModal(false);
                fetchTenants(); 
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: `Failed: ${data.error || 'Unknown error'}`, autoClose: true, duration: 5000 });
            }
        } catch (err) {
            setNotificationState({ isOpen: true, type: 'error', message: "Server error approving renewal.", autoClose: true, duration: 3000 });
        }
    };

    const handleRejectRenewal = async (tenantId, reason, contractIdArg, reviewTypeArg = "contract") => {
        try {
            const contractId = contractIdArg
                || (Array.isArray(records.find((tenant) => String(tenant.id) === String(tenantId))?.contracts)
                    ? records
                        .find((tenant) => String(tenant.id) === String(tenantId))
                        .contracts
                        .find((contract) => contract.status === 'pending_approval')?._id
                    : null);

            const isPaymentReviewFlow = reviewTypeArg === "payment" || !contractId;

            if (isPaymentReviewFlow) {
                const paymentResponse = await fetch(`${API_URL}/tenants/${tenantId}/reject-renewal`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rejectionReason: reason })
                });

                if (paymentResponse.ok) {
                    setNotificationState({
                        isOpen: true,
                        type: 'success',
                        message: "Renewal payment rejected. Tenant notified.",
                        autoClose: true,
                        duration: 3000
                    });
                    await logActivity(role, "REJECT_RENEWAL", `Rejected renewal payment review for tenant ID #${tenantId}. Reason: ${reason}`, "Tenants");

                    fetchTenants();
                    if (showReviewModal) setShowReviewModal(false);
                } else {
                    setNotificationState({ isOpen: true, type: 'error', message: "Failed to reject renewal payment.", autoClose: true, duration: 3000 });
                }
                return;
            }

            const response = await fetch(`${API_URL}/tenants/${tenantId}/contracts/${contractId}/reject-renewal-request`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectionReason: reason })
            });

            if (response.ok) {
                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: "Renewal contract rejected. Tenant notified.",
                    autoClose: true,
                    duration: 3000
                });
                await logActivity(role, "REJECT_RENEWAL", `Rejected renewal contract for tenant ID #${tenantId}. Reason: ${reason}`, "Tenants");

                fetchTenants();
                if (showReviewModal) setShowReviewModal(false);
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to reject renewal payment.", autoClose: true, duration: 3000 });
            }
        } catch (error) {
            console.error(error);
            setNotificationState({ isOpen: true, type: 'error', message: "Error rejecting renewal payment.", autoClose: true, duration: 3000 });
        }
    };

    const confirmArchive = async () => {
        if (!archiveRow) return;
        const rowToArchive = archiveRow;
        setArchiveRow(null);

        try {
            const idToArchive = rowToArchive._id || rowToArchive.id;

            const res = await fetch(`${API_URL}/tenants/${idToArchive}/archive`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed to archive record");

            await logActivity(role, "ARCHIVE_TENANT", `Archived tenant: ${rowToArchive.tenantName || rowToArchive.name}`, "Tenants");

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: "Tenant moved to Archives successfully.",
                autoClose: true,
                duration: 2000
            });

            fetchTenants(); 
        } catch (e) {
            console.error("Failed to archive:", e);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Failed to archive record.",
                autoClose: true,
                duration: 2000
            });
        }
    };

    const handleStartOperation = async () => {
        if (!operationRow) return;
        
        const tenantId = operationRow.id || operationRow._id;
        const tenantName = operationRow.tenantName || operationRow.name;

        try {
            const res = await fetch(`${API_URL}/tenants/${tenantId}/start-operation`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to start operation");
            }

            setNotificationState({ isOpen: true, type: 'success', message: "Operation officially started!", autoClose: true, duration: 3000 });
            await logActivity(role, "START_OPERATION", `Started operation for tenant: ${tenantName}`, "Tenants");
            
            setOperationRow(null); 
            fetchTenants();        
        } catch (e) {
            console.error(e);
            setNotificationState({ isOpen: true, type: 'error', message: e.message || "Failed to start operation.", autoClose: true, duration: 3000 });
        }
    };

    const handleToggleOperation = async () => {
        if (!toggleOpRow) return;
        const tenantId = toggleOpRow.id || toggleOpRow._id;
        const tenantName = toggleOpRow.tenantName || toggleOpRow.name;
        const isCurrentlyPaused = toggleOpRow.isOperationPaused;

        try {
            const res = await fetch(`${API_URL}/tenants/${tenantId}/toggle-operation`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to toggle operation");
            }

            setNotificationState({ 
                isOpen: true, type: 'success', 
                message: isCurrentlyPaused ? "Operations resumed!" : "Operations paused.", 
                autoClose: true, duration: 3000 
            });
            
            await logActivity(role, "TOGGLE_OPERATION", `${isCurrentlyPaused ? 'Resumed' : 'Paused'} operations for tenant: ${tenantName}`, "Tenants");
            
            setToggleOpRow(null); 
            fetchTenants();       
        } catch (e) {
            console.error(e);
            setNotificationState({ isOpen: true, type: 'error', message: e.message || "Failed to update operation status.", autoClose: true, duration: 3000 });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteRow?.id && !deleteRow?._id) return;
        const idToDelete = deleteRow._id || deleteRow.id;
        try {
            const response = await fetch(`${API_URL}/tenants/${idToDelete}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Failed to delete record.");

            await logActivity(role, "DELETE_TENANT", `Permanently deleted tenant ID #${idToDelete}`, "Tenants");
            setRecords(prev => prev.filter(item => (item._id || item.id) !== idToDelete));
            setDeleteRow(null);
            setNotificationState({ isOpen: true, type: 'success', message: "Record successfully deleted!", autoClose: true, duration: 3000 });
        } catch (e) {
            console.error(e);
            setNotificationState({ isOpen: true, type: 'error', message: `Error deleting record: ${e.message}`, autoClose: true, duration: 3000 });
        }
    };

    const handleDeleteRequestConfirm = async () => {
        if (!deleteRow) return;

        const rowId = String(deleteRow._id || deleteRow.id || "");
        if (rowId && deleteRequestIds.includes(rowId)) {
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Deletion request already pending for this tenant.",
                autoClose: true,
                duration: 3000,
            });
            setDeleteRow(null);
            setDeleteRemarks("");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/deletion-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: "Tenant Lease",
                    itemDescription: `Slot ${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}`,
                    requestedBy: "Tenant Admin",
                    originalData: deleteRow,
                    reason: deleteRemarks || "No remarks provided.",
                }),
            });

            if (!response.ok) throw new Error("Failed to submit deletion request");

            await sendNotification(
                "Deletion Request: Tenants",
                `Tenant Admin requested deletion for slot ${deleteRow.slotNo}.`,
                "Tenants",
                "superadmin",
            );

            await logActivity(
                role,
                "REQUEST_DELETE",
                `Requested deletion for tenant slot ${deleteRow.slotNo}`,
                "Tenants",
            );

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: "Deletion request sent to Superadmin.",
                autoClose: true,
                duration: 3000,
            });

            setDeleteRow(null);
            setDeleteRemarks("");
            await fetchDeleteRequests();
        } catch (error) {
            console.error("Delete request error:", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Failed to submit deletion request.",
                autoClose: true,
                duration: 3000,
            });
        }
    };

    const handleBroadcast = async () => {
        let targetTenants = records;
        if (notifyDraft.targetGroup !== "All") {
            targetTenants = records.filter(t => t.tenantType === notifyDraft.targetGroup);
        }

        try {
            await sendBroadcast(API_URL, notifyDraft, targetTenants);
            await logActivity(role, "BROADCAST_MSG", `Sent/Scheduled broadcast: ${notifyDraft.title}`, "Tenants");

            setShowNotify(false);
            setNotifyDraft({
                title: "", message: "", targetGroup: "All", dueDate: "", scheduleTime: "", isScheduled: false, attachment: null, templateApplied: false
            });

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: notifyDraft.isScheduled ? "Broadcast scheduled successfully!" : "Broadcast sent to all tenants!",
                autoClose: true,
                duration: 3000
            });

        } catch (error) {
            console.error("Broadcast Error:", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: "Failed to process broadcast.",
                autoClose: true,
                duration: 3000
            });
        }
    };

    const handleSendEmail = async (recipient, body) => {
        if (!recipient?.email) {
            setNotificationState({ isOpen: true, type: 'error', message: "This tenant does not have an email address on file.", autoClose: true, duration: 3000 });
            return;
        }

        if (!body.trim()) {
            setNotificationState({ isOpen: true, type: 'error', message: "Please enter a message body.", autoClose: true, duration: 3000 });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tenants/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: recipient.email,
                    subject: `Update regarding your lease (Slot ${recipient.slotNo || 'N/A'})`,
                    message: body
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to send email");
            }

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: `Email sent successfully to ${recipient.tenantName || recipient.name}!`,
                autoClose: true,
                duration: 3000
            });

            await logActivity(role, "SEND_EMAIL", `Sent email to ${recipient.tenantName || recipient.name}`, "Tenants");

            setShowEmailModal(false);
            setEmailBody("");

        } catch (error) {
            console.error("Email Error:", error);
            setNotificationState({
                isOpen: true,
                type: 'error',
                message: error.message || "Failed to send email. Check backend connection.",
                autoClose: true,
                duration: 3000
            });
        }
    };

    const getExportData = () => {
        return filtered.map(t => ({
            "Slot No": t.slotNo,
            "Ref No": t.referenceNo || t.referenceno || "-",
            "Tenant Name": t.tenantName || t.name,
            "Email": t.email || "-",
            "Contact No": t.contactNo || "-",
            "Start Date": formatDate(t.StartDateTime),
            "Due Date": formatDate(t.DueDateTime || t.EndDateTime),
            "Rent Amount": t.rentAmount ? `₱${t.rentAmount}` : "0",
            "Utility Amount": t.utilityAmount ? `₱${t.utilityAmount}` : "0",
            "Total Due": `₱${t.totalAmount || calculateDueAmount(t)}`,
            "Status": t.status,
        }));
    };

    const handleSingleExportPDF = (t) => {
        if (!t) return;
        if (!validateCollector()) return;

        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        
        doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

       
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("TENANT LEASE SUMMARY", pageWidth / 2, 45, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 15, 55);
        doc.text(`Collector: ${collectorName.trim() || "N/A"}`, 15, 61);

       
        const feeBreakdown = typeof t.feeBreakdown === 'string' 
            ? JSON.parse(t.feeBreakdown || '{}') 
            : (t.feeBreakdown || {});
        const isPermanentTenant = (t.tenantType || t.floor || "Permanent") === "Permanent";
        const electricity = isPermanentTenant ? Number(feeBreakdown.electricity || 0) : 0;
        const otherAmount = Number(feeBreakdown.otherAmount || 0);
        const otherSpecify = feeBreakdown.otherSpecify || "Other Fees";

        const tableBody = [
            ["Slot Number", t.slotNo || "-"],
            ["Reference Number", t.referenceNo || t.referenceno || "-"],
            ["Tenant Name", t.tenantName || t.name || "-"],
            ["Email Address", t.email || "-"],
            ["Contact Number", t.contactNo || "-"],
            ["Lease Period", `${formatDate(t.StartDateTime)} to ${formatDate(t.DueDateTime || t.EndDateTime)}`],
            ["Rent Amount", `PHP ${(t.rentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ["Additional Fees (Total)", `PHP ${(t.utilityAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
        ];

        if (electricity > 0) tableBody.push(["    Electricity", `PHP ${electricity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
        if (otherAmount > 0) tableBody.push([`    ${otherSpecify}`, `PHP ${otherAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);

        tableBody.push(["Total Due", `PHP ${(t.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
        tableBody.push(["Current Status", t.status || "-"]);

        autoTable(doc, {
            startY: 70,
            margin: { left: 15, right: 15 },
            head: [["Description", "Details"]],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }, 
            styles: { cellPadding: 5, fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', width: 50 },
            }
        });

        
        const footerY = pageHeight - 30;
        doc.addImage(footerImg, "PNG", 0, footerY, pageWidth, 30);

        doc.save(`Lease_Summary_${t.slotNo}_${t.tenantName?.replace(/\s+/g, '_')}.pdf`);
        logActivity(role, "EXPORT_PDF", `Exported individual PDF: ${t.tenantName}`, "Tenants");
    };

    const handleExportExcel = async () => {
        if (!validateCollector()) return;
        if (filtered.length === 0) return alert("No records to export.");

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Tenant Lease Report");

          
            worksheet.getRow(1).height = 35;
            await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:G4');

           
          
            worksheet.mergeCells('A6:J6');
            const titleCell = worksheet.getCell('A6');
            titleCell.value = 'TENANTS AND LEASE REPORTS';
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
            titleCell.alignment = { horizontal: 'center' };

            worksheet.addRow([]); 
            worksheet.addRow([`Date: ${new Date().toLocaleDateString()}`, '', '', '', '', '', '', '', '', `No. of Payments: ${filtered.length}`]);
            worksheet.addRow([`Revenue: Php ${mapStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '', '', '', '', '', '', '', '', '']);
            worksheet.addRow([]);

           
            const headerRow = worksheet.addRow([
                "Slot No.", "Name", "Email", "Contact No.", "Rent", 
                "Electricity", "Other Fees",
                "Total Utility", "Total Due"
            ]);
            
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Populate rows with parsed fee breakdown
            filtered.forEach((t) => {
                const feeBreakdown = typeof t.feeBreakdown === 'string' 
                    ? JSON.parse(t.feeBreakdown || '{}') 
                    : (t.feeBreakdown || {});
                const isPermanentTenant = (t.tenantType || t.floor || "Permanent") === "Permanent";
                const electricity = isPermanentTenant ? Number(feeBreakdown.electricity || 0) : 0;

                worksheet.addRow([
                    t.slotNo || "-",
                    t.tenantName || t.name || "-",
                    t.email || "-",
                    t.contactNo || "-",
                    `Php ${(t.rentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `Php ${electricity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `Php ${(Number(feeBreakdown.otherAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `Php ${(t.utilityAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `Php ${(t.totalAmount || calculateDueAmount(t)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                ]);
            });

            const lastRowNumber = worksheet.lastRow.number + 2;
            worksheet.getRow(lastRowNumber).height = 52.5;
          
            await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:J${lastRowNumber + 3}`);

          
            worksheet.columns = [
                { width: 12 }, { width: 30 }, { width: 25 }, { width: 15 }, 
                { width: 15 }, 
                { width: 12 }, { width: 12 }, 
                { width: 15 }, { width: 15 } 
            ];

          
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Tenants_Lease_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            logActivity(role, "EXPORT_EXCEL", `Exported branded report for ${filtered.length} tenants`, "Tenants");

        } catch (err) {
            console.error("Tenant Excel Export Error:", err);
            alert("Failed to export Excel. Check console for details.");
        }
    };

    const handleExportPDF = () => {
        if (!validateCollector()) return;
        if (filtered.length === 0) return alert("No records to export.");

        const doc = new jsPDF("l", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("TENANTS AND LEASE REPORTS", pageWidth / 2, 45, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);

        doc.text(`No. of Payments: ${filtered.length}`, pageWidth - 15, 55, { align: "right" });
        doc.text(
            `Revenue: Php ${mapStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            pageWidth - 15,
            61,
            { align: "right" }
        );

       autoTable(doc, {
            startY: 70,
            margin: { bottom: 35, left: 10, right: 10 }, 
            head: [["Slot", "Name", "Email", "Contact", "Rent", "Electricity", "Others", "Utilities Total", "Total Due"]],
            body: filtered.map((t) => {
                const feeBreakdown = typeof t.feeBreakdown === 'string' 
                    ? JSON.parse(t.feeBreakdown || '{}') 
                    : (t.feeBreakdown || {});
                const isPermanentTenant = (t.tenantType || t.floor || "Permanent") === "Permanent";
                const electricity = isPermanentTenant ? Number(feeBreakdown.electricity || 0) : 0;
                    
                return [
                    t.slotNo || "-",
                    t.tenantName || t.name || "-",
                    t.email || "-",
                    t.contactNo || "-",
                    `${(t.rentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `${electricity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `${(Number(feeBreakdown.otherAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `${(t.utilityAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `${(t.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                ];
            }),
            headStyles: { fillColor: [16, 185, 129], fontSize: 7 },
            styles: { fontSize: 7, halign: 'center', cellPadding: 2 },
            columnStyles: {
                1: { halign: 'left' },
                2: { halign: 'left' },
            },
            didDrawPage: (data) => {
                doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
            },
        });

        doc.save(`Tenants_Lease_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        logActivity(role, "EXPORT_PDF", `Exported ${filtered.length} Tenant records to PDF`, "Tenants");
    };

    const baseColumns = ["Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Report State"];
    
   if (activeTab === "permanent") {
        baseColumns.push("Advance Bal"); 
    }
    
    baseColumns.push("Rent", "Util", "Total Due", "Status");

    const tableColumns = isSelectionMode
        ? [
            <div key="header-check" className="flex items-center">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
            </div>,
            ...baseColumns
        ]
        : baseColumns;

    const actionRequiredCount = waitlistData.filter(app => !app.adminViewed && app.status !== 'TENANT').length;

    const renewalContractRequests = useMemo(() => {
        const pending = [];
        records.forEach((tenant) => {
            const contracts = Array.isArray(tenant.contracts) ? tenant.contracts : [];
            contracts
                .filter((contract) => contract.status === 'pending_approval')
                .forEach((contract) => {
                    pending.push({
                        ...tenant,
                        _id: tenant._id || tenant.id,
                        id: tenant.id,
                        reviewSource: 'renewal',
                        status: 'PENDING_APPROVAL',
                        renewalContractId: contract._id,
                        renewalRequestedAt: contract.requestedAt || contract.assignedAt || contract.startDate,
                        renewalTemplateName: contract.templateName || contract.contractType || 'Renewal Contract',
                        renewalStartDate: contract.startDate,
                        renewalEndDate: contract.endDate,
                        contractUrl: contract.documentUrl || tenant.documents?.contract || '',
                        documents: {
                            ...(tenant.documents || {}),
                            contract: contract.documentUrl || tenant.documents?.contract || '',
                        },
                    });
                });
        });
        return pending;
    }, [records]);

    const tenantPaymentReviewRequests = useMemo(() => {
        return records
            .filter((tenant) => tenant.status === 'Payment Review' || tenant.status === 'PAYMENT_REVIEW')
            .map((tenant) => ({
                ...tenant,
                _id: tenant._id || tenant.id,
                id: tenant.id,
                reviewSource: 'renewal',
                renewalReviewType: 'payment',
                renewalRequestedAt: tenant.updatedAt || tenant.StartDateTime,
            }));
    }, [records]);

    const renewalReviewQueue = useMemo(
        () => [...renewalContractRequests, ...tenantPaymentReviewRequests],
        [renewalContractRequests, tenantPaymentReviewRequests]
    );

    const renewalsPendingCount = renewalReviewQueue.length;

    return (
        <Layout title="Tenants/Lease Management">
            <div className="mb-6">
                <StatCardGroup {...mapStats} />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-3">
                <div className="flex flex-col gap-3 w-full lg:flex-1 min-w-0">
                    {role === "lease" && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap shrink-0">
                                Name of Collector:
                            </label>
                            <input
                                type="text"
                                value={collectorName}
                                maxLength={100}
                                onChange={(e) => {
                                    setCollectorName(e.target.value.slice(0, 100));
                                    setCollectorId("");
                                }}
                                placeholder="Enter collector name"
                                className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                    )}
                   <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
                    {(role === "lease") && (
                        <button
                            onClick={handleOpenSubmitModal}
                            disabled={isReporting}
                            className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Submit Report</span>
                        </button>
                    )}

                    {(role === "lease") && (
                        <button
                            onClick={() => {
                                fetchPreviousShiftReports();
                                setShowPreviousShiftModal(true);
                            }}
                            className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            <span className="hidden sm:inline">Previous Shift Records</span>
                            <span className="sm:hidden">Previous Shifts</span>
                        </button>
                    )}

                    <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center cursor-pointer" title='Add New Tenant'>
                        + Add New
                    </button>

                    {role === "superadmin" && (
                        <button
                            onClick={() => {
                                if (activeTab === "night") {
                                    setNewNightPrice(defaultNightPrice.toString());
                                    setNewNightWeeklyRent(defaultNightWeeklyRent.toString());
                                    setNewChargePct(nightChargePct.toString());
                                    setNewInterestPct(nightInterestPct.toString());
                                    setNewNightMaxTerminationDays(nightMaxTerminationDays.toString());
                                } else {
                                    setNewPermanentPrice(defaultPermanentPrice.toString());
                                    setNewChargePct(permChargePct.toString());
                                    setNewInterestPct(permInterestPct.toString());
                                    setNewDueDate(defaultDueDate.toString());
                                    setNewDailyFee(defaultDailyFee.toString());
                                }
                                setShowSetPriceModal(true);
                            }}
                            
                            className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                            title='Set Default Price'
                        >
                            <Settings size={18} />
                            <span className="hidden sm:inline">Set Price</span>
                        </button>
                    )}

                    {role === "superadmin" && (
                        <button
                            onClick={() => setShowContractsOverview(true)}
                            className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                            title='Manage Contracts'
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Manage Contracts</span>
                        </button>
                    )}

                    <ExportMenu
                        onPrint={() => {
                            if (!validateCollector()) return;
                            window.print();
                        }}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                </div>
            </div>

            <div className="flex flex-col xl:flex-row items-start justify-between gap-4 mb-6">
                
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200">
                            <button onClick={() => setActiveTab("permanent")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${activeTab === "permanent" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
                                <Store size={18} /> <span className="hidden sm:inline">Permanent</span>
                            </button>
                            <button onClick={() => setActiveTab("night")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${activeTab === "night" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
                                <MoonStar size={18} /> <span className="hidden sm:inline">Night Market</span>
                            </button>
                        </div>
                        <button onClick={() => setShowMapModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all cursor-pointer">
                            <Map size={18} /> <span className="hidden sm:inline">View Map</span>
                        </button>
                        <button onClick={() => { setActiveWaitlistTab("All"); setShowWaitlistModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all cursor-pointer">
                            <ClipboardList size={18} /> <span className="hidden sm:inline">Applicants</span>
                            {actionRequiredCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {actionRequiredCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center">
                        <TenantStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
                    </div>
                </div>

                <div className="flex flex-col items-start xl:items-end gap-3 w-full xl:w-auto">
                    
                    {role === "superadmin" && (
                        <div className="flex items-center gap-2">
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
                                    <button 
                                        onClick={handlePrevPeriod} 
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 whitespace-nowrap">
                                        <Calendar size={16} className="text-slate-400" />
                                        {getPeriodDisplayStr()}
                                    </div>
                                    <button 
                                        onClick={handleNextPeriod} 
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3">
                        {(role === "superadmin" || role === "lease") && (
                            <>
                                <button
                                    onClick={() => setShowLogModal(true)}
                                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-3 sm:px-4 h-[42px] rounded-xl shadow-sm hover:border-slate-300 transition-all"
                                    title="View Logs"
                                >
                                    <History size={18} />
                                    <span className="hidden sm:inline cursor-pointer">Logs</span>
                                </button>
                                <button
                                    onClick={() => setShowPaymentRecords(true)}
                                    className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-3 sm:px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
                                    title="View Payment Records"
                                >
                                    <Wallet size={18} />
                                    <span className="hidden sm:inline">Records</span>
                                </button>
                            </>
                        )}

                        {isSelectionMode && selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-[42px]">
                                <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                                    {selectedIds.length} Selected
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    title="Request Delete"
                                    className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {(role === "lease") && (
                            <button
                                onClick={toggleSelectionMode}
                                title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                                className={`flex items-center justify-center cursor-pointer h-[42px] w-[42px] sm:w-auto sm:px-3 rounded-xl transition-all border ${isSelectionMode
                                    ? "bg-red-500 text-white shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                            >
                                {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {renewalsPendingCount > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-700">
                        <ClipboardList size={20} />
                        <span className="font-semibold">Action Required: You have {renewalsPendingCount} pending lease renewal contract request(s) awaiting review.</span>
                    </div>
                    <button 
                        onClick={() => { setActiveWaitlistTab("Renewals"); setShowWaitlistModal(true); }}
                        className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                        View Renewals
                    </button>
                </div>
            )}

            <TerminalBoardShell title="Tenant Board">
                <Table
                    variant="terminal"
                    columns={tableColumns}
                    data={paginatedData.map((t) => {
                    const isSubmitted = Boolean(t.submitted || t.reportId);
                    const isDeleteRequested = deleteRequestIds.includes(String(t.id));
                    const isDeleteHighlighted = isDeleteRequested || isSubmitted;
                    
                    const baseData = {
                        id: t.id,
                        slotno: t.slotNo,
                        refno: t.referenceNo || t.referenceno || (t.paymentHistory && t.paymentHistory.length > 0 ? t.paymentHistory[t.paymentHistory.length - 1].referenceNo : "-"),
                        name: t.tenantName || t.name,
                        email: t.email,
                        contactno: t.contactNo,
                        startdate: formatDate(t.StartDateTime),
                        duedate: formatDate(t.DueDateTime || t.EndDateTime),
                        reportstate: isDeleteRequested ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Delete Requested</span>
                        ) : isSubmitted ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Submitted</span>
                        ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Pending</span>
                        )
                    };

                    if (activeTab === "permanent") {
                        baseData.advancebal = t.advancePaymentBalance ? `₱${Number(t.advancePaymentBalance).toLocaleString()}` : "-";
                    }

                    baseData.rent = t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-";
                    baseData.util = t.utilityAmount ? `₱${t.utilityAmount.toLocaleString()}` : "₱0";
                    baseData.totaldue = `₱${(t.totalAmount || calculateDueAmount(t)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    baseData.status = t.status;
                    baseData.__highlight = isDeleteHighlighted;
                    baseData.__highlightVariant = isDeleteRequested ? "amber" : "emerald";
                    
                    if (isSelectionMode) {
                        return {
                            select: (
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(t.id)}
                                        onChange={() => toggleSelect(t.id)}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </div>
                            ),
                            ...baseData
                        };
                    }
                    return baseData;
                })}
                
                    actions={(row) => {
                    if (isSelectionMode) return null;
                    const fullRecord = records.find(r => r.id === row.id);

                    let operationDaysText = "";
                    let isPaused = false;
                    
                    if (fullRecord?.operationStartDate) {
                        isPaused = fullRecord.isOperationPaused;
                        const msPerDay = 1000 * 60 * 60 * 24;
                        
                        const endDate = (isPaused && fullRecord.lastPausedDate) 
                            ? new Date(fullRecord.lastPausedDate) 
                            : new Date();
                            
                        const rawMs = Math.abs(endDate - new Date(fullRecord.operationStartDate));
                        const rawDays = rawMs / msPerDay;
                        const totalPaused = fullRecord.totalPausedDays || 0;
                        
                        const activeDays = Math.floor(rawDays - totalPaused);
                        operationDaysText = `${activeDays > 0 ? activeDays : 0} Day(s)`;
                    }

                    return (
                        <div className="flex justify-end items-center space-x-2">
                            
                            {!fullRecord?.operationStartDate ? (
                                <button
                                    onClick={() => setOperationRow(fullRecord)}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center cursor-pointer shadow-sm border border-emerald-200"
                                    title="Click to Start Operation (Day 1)"
                                >
                                    <Play size={16} className="fill-emerald-500" />
                                </button>
                            ) : (
                                <div className={`flex items-center gap-1 border p-1 rounded-lg ${isPaused ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <span 
                                        className={`text-[10px] font-bold px-2 py-1.5 rounded-md whitespace-nowrap ${isPaused ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`} 
                                        title={`Started on ${new Date(fullRecord.operationStartDate).toLocaleDateString()}`}
                                    >
                                        Op: {operationDaysText} {isPaused && "(Paused)"}
                                    </span>
                                    <button
                                        onClick={() => setToggleOpRow(fullRecord)}
                                        className={`p-1 rounded-md transition-all cursor-pointer ${isPaused ? 'text-emerald-600 hover:bg-emerald-100' : 'text-amber-600 hover:bg-amber-100'}`}
                                        title={isPaused ? "Resume Operations" : "Pause Operations"}
                                    >
                                        {isPaused ? <Play size={14} className="fill-emerald-500" /> : <Pause size={14} className="fill-amber-500" />}
                                    </button>
                                </div>
                            )}
                                                        <TableActions
                                                            onView={() => setViewRow(records.find(r => r.id === row.id))}
                                                            onEdit={() => setEditRow(records.find(r => r.id === row.id))}
                                                            onDelete={
                                                                role === "lease"
                                                                    ? () => {
                                                                        setDeleteRow(records.find(r => r.id === row.id));
                                                                        setDeleteRemarks("");
                                                                    }
                                                                    : undefined
                                                            }
                                                            deleteVariant={role === "lease" ? "request" : "delete"}
                                                        />
                            <button onClick={() => handleSingleExportPDF(fullRecord)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer" title="Rent Statement"><Download size={16} /></button>
                            <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all cursor-pointer" title="Send Email"><Mail size={16} /></button>
                            <button onClick={() => setArchiveRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all cursor-pointer" title="Archive Record"><Archive size={16} /></button>
                            {role === "superadmin" && (
                                <button
                                    onClick={() => setDeleteRow(records.find(r => r.id === row.id))}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                                    title="Delete Record"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            {fullRecord?.status !== "Moved Out" && (
                                <button 
                                    onClick={() => {
                                        setTenantToMoveOut(fullRecord);
                                        setIsMoveOutModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
                                >
                                    Move Out
                                </button>
                            )}

                        </div>
                    )
                }}
                />
            </TerminalBoardShell>

            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filtered.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
                onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />

            <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />
            <ContractsOverviewModal
                isOpen={role === "superadmin" && showContractsOverview}
                onClose={() => setShowContractsOverview(false)}
                tenants={records}
                apiUrl={API_URL}
                onNotify={(type, message) =>
                    setNotificationState({
                        isOpen: true,
                        type,
                        message,
                        autoClose: true,
                        duration: 3500,
                    })
                }
                onManageTenant={(tenant) => {
                    setShowContractsOverview(false);
                    setContractRow(tenant);
                }}
            />
            <ContractManagementModal
                isOpen={role === "superadmin" && !!contractRow}
                onClose={() => setContractRow(null)}
                onBack={() => {
                    setContractRow(null);
                    setShowContractsOverview(true);
                }}
                tenant={contractRow}
                apiUrl={API_URL}
                onSaved={fetchTenants}
                onNotify={(type, message) =>
                    setNotificationState({
                        isOpen: true,
                        type,
                        message,
                        autoClose: true,
                        duration: 3500,
                    })
                }
            />
            <TenantMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} activeTab={activeTab} records={records} onSelectSlot={(tenant) => setViewRow(tenant)} />
            <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

            <WaitlistModal
                isOpen={showWaitlistModal}
                initialTab={activeWaitlistTab}
                onClose={() => setShowWaitlistModal(false)}
                waitlistData={waitlistData}
                showForm={showWaitlistForm}
                setShowForm={setShowWaitlistForm}
                formData={waitlistForm}
                setFormData={setWaitlistForm}
                onAdd={handleAddToWaitlist}
                onApprove={handleStartApproval}
                onReject={handleRejectApplicant}
                onRejectRenewal={handleRejectRenewal}

                renewalsData={renewalReviewQueue}
                onReviewRenewal={(record) => {
                    setReviewData(record);
                    setShowWaitlistModal(false);
                    setShowReviewModal(true);
                }}
            />

            <TenantEmailModal
                isOpen={showEmailModal}
                onClose={() => {
                    setShowEmailModal(false);
                    setEmailBody("");
                }}
                recipient={messagingRow}
                body={emailBody}
                setBody={setEmailBody}
                onSend={handleSendEmail}
            />

            <ApplicationReviewModal
                isOpen={showReviewModal}
                reviewData={reviewData}
                defaultPermanentPrice={defaultPermanentPrice}
                defaultDueDate={defaultDueDate}
                onClose={() => setShowReviewModal(false)}
                onBack={() => { 
                  setShowReviewModal(false); 
                  if (!reviewData.tenantName) setShowWaitlistModal(true); 
                }}
                onUnlockPayment={handleUnlockPayment}
                onRequestContract={handleRequestContract}
                onProceedToLease={handleProceedToLease}
                onReject={handleRejectApplicant}
                onApproveRenewal={(tenantId) => handleApproveRenewal(tenantId, reviewData?.renewalContractId, reviewData?.renewalReviewType || "contract")} 
                onRejectRenewal={(tenantId, reason) => handleRejectRenewal(tenantId, reason, reviewData?.renewalContractId, reviewData?.renewalReviewType || "contract")}
            />

            <AddTenantModal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setTransferApplicant(null); }}
                onSave={handleAddTenant}
                tenants={records}
                activeTab={activeTab}
                defaultNightPrice={defaultNightPrice}
                defaultNightWeeklyRent={defaultNightWeeklyRent}
                defaultPermanentPrice={defaultPermanentPrice}
                defaultDueDate={defaultDueDate}
                initialData={transferApplicant ? {
                    name: transferApplicant.name,
                    contactNo: transferApplicant.contact,
                    email: transferApplicant.email,
                    tenantType: transferApplicant.floor || transferApplicant.preferredType || "Permanent",
                    products: transferApplicant.product,
                    uid: transferApplicant.userId,
                    slotNo: transferApplicant.targetSlot || "",
                    referenceNo: transferApplicant.paymentReference || "",
                    documents: {
                        businessPermit: transferApplicant.permitUrl,
                        validID: transferApplicant.validIdUrl,
                        barangayClearance: transferApplicant.clearanceUrl,
                        proofOfReceipt: transferApplicant.receiptUrl,
                        contract: transferApplicant.contractUrl,
                        communityTax: transferApplicant.communityTaxUrl,
                        policeClearance: transferApplicant.policeClearanceUrl
                    }
                } : null}
            />

            {editRow && (
                <EditTenantLease
                    row={editRow}
                    tenants={records}
                    permChargePct={permChargePct}    
                    permInterestPct={permInterestPct} 
                    nightChargePct={nightChargePct}   
                    nightInterestPct={nightInterestPct} 
                    onClose={() => setEditRow(null)}
                    onSave={async (updatedData) => {
                        try {
                            const idToUpdate = updatedData._id || updatedData.id;
                            if (!idToUpdate) {
                                setNotificationState({ isOpen: true, type: 'error', message: "Error: No Tenant ID found to update.", autoClose: true, duration: 3000 });
                                return;
                            }

                            const formData = new FormData();
                            Object.keys(updatedData).forEach(key => {
                                if (key === 'documents' || key === 'id' || key === '_id' || key === 'contracts') return;
                                const value = updatedData[key];
                                if (value === undefined || value === null) return;
                                if (key === 'reportId' && typeof value === 'string' && !value.trim()) return;
                                if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return;
                                if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) return;
                                formData.append(key, value);
                            });

                            if (updatedData.documents) {
                                const docKeys = ['businessPermit', 'validID', 'contract', 'barangayClearance', 'proofOfReceipt', 'communityTax', 'policeClearance'];
                                docKeys.forEach(docKey => {
                                    const docValue = updatedData.documents[docKey];
                                    if (docValue instanceof File) {
                                        formData.append(docKey, docValue);
                                    } else if (typeof docValue === 'string' && docValue.trim() !== "") {
                                        formData.append(docKey, docValue);
                                    }
                                });
                            }

                            const response = await fetch(`${API_URL}/tenants/${idToUpdate}`, {
                                method: 'PUT',
                                body: formData
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || "Update failed");
                            }
                            
                            let finalMessage = "Tenant updated successfully!";
                            if (editRow?.status !== 'Overdue' && updatedData.status === 'Overdue') {
                                finalMessage = "Tenant updated successfully! Marked Overdue & notification email sent.";
                            }
                            
                            setNotificationState({ 
                                isOpen: true, 
                                type: 'success', 
                                message: finalMessage, 
                                autoClose: true, 
                                duration: 4000 
                            });

                            await logActivity(role, "EDIT_TENANT", `Updated tenant details for ${updatedData.tenantName || updatedData.name}`, "Tenants");
                            fetchTenants();
                            setEditRow(null);
                        } catch (error) {
                            console.error("Update Error:", error);
                            setNotificationState({ isOpen: true, type: 'error', message: `Failed to update record: ${error.message}`, autoClose: true, duration: 3000 });
                        }
                    }}
                />
            )}

            <DeleteModal
                isOpen={role === "superadmin" && !!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion."
                itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""}
            />

            <RequestDeletionModal
                isOpen={role === "lease" && !!deleteRow}
                onClose={() => {
                    setDeleteRow(null);
                    setDeleteRemarks("");
                }}
                onConfirm={handleDeleteRequestConfirm}
                itemIdentifier={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""}
                remarks={deleteRemarks}
                setRemarks={setDeleteRemarks}
            />

            <BroadcastModal
                isOpen={showNotify}
                onClose={() => setShowNotify(false)}
                onBroadcast={handleBroadcast}
                draft={notifyDraft}
                setDraft={setNotifyDraft}
            />

            <ArchiveConfirmModal
                isOpen={!!archiveRow}
                row={archiveRow}
                onClose={() => setArchiveRow(null)}
                onConfirm={confirmArchive}
            />

            {operationRow && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-100 rounded-full shadow-inner">
                                <Play size={24} className="fill-emerald-500 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Start Operations</h3>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Slot #{operationRow.slotNo}</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-sm text-slate-600">
                            Are you sure you want to officially start operations for <span className="font-bold text-slate-800">{operationRow.tenantName || operationRow.name}</span>? 
                            <br/><br/>
                            Confirming this will permanently lock in today (<span className="font-semibold">{new Date().toLocaleDateString()}</span>) as their official <strong>Day 1</strong> of operations.
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                onClick={() => setOperationRow(null)}
                                className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartOperation}
                                className="px-6 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-2"
                            >
                                <Play size={16} className="fill-white" />
                                Confirm & Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toggleOpRow && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-full shadow-inner ${toggleOpRow.isOperationPaused ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                {toggleOpRow.isOperationPaused 
                                    ? <Play size={24} className="fill-emerald-500 text-emerald-600" />
                                    : <Pause size={24} className="fill-amber-500 text-amber-600" />
                                }
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {toggleOpRow.isOperationPaused ? "Resume Operations" : "Pause Operations"}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Slot #{toggleOpRow.slotNo}</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-sm text-slate-600">
                            {toggleOpRow.isOperationPaused ? (
                                <>
                                    Are you sure you want to resume operations for <span className="font-bold text-slate-800">{toggleOpRow.tenantName || toggleOpRow.name}</span>? 
                                    <br/><br/>
                                    The "Days of Operation" counter will begin ticking again starting from today.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to pause operations for <span className="font-bold text-slate-800">{toggleOpRow.tenantName || toggleOpRow.name}</span>? 
                                    <br/><br/>
                                    The "Days of Operation" counter will freeze until they are resumed.
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                onClick={() => setToggleOpRow(null)}
                                className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleOperation}
                                className={`px-6 py-2 text-sm font-bold text-white active:scale-95 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-2 ${toggleOpRow.isOperationPaused ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                            >
                                {toggleOpRow.isOperationPaused ? (
                                    <><Play size={16} className="fill-white" /> Confirm Resume</>
                                ) : (
                                    <><Pause size={16} className="fill-white" /> Confirm Pause</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="py-10 text-center text-slate-500">No previous shift reports found for this Lease Admin.</div>
                        ) : (
                            <div className="max-h-[65vh] overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Submitted At</th>
                                            <th className="px-4 py-3">Shift</th>
                                            <th className="px-4 py-3">Collector</th>
                                            <th className="px-4 py-3">Records</th>
                                            <th className="px-4 py-3">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previousShiftReports.map((report) => {
                                            const recordCount =
                                                report?.data?.data?.length ??
                                                report?.data?.statistics?.submittedShiftRecords ??
                                                0;
                                            const revenue = Number(report?.data?.statistics?.totalRevenue) || 0;
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
                                                        {report?.data?.statistics?.collector || report?.data?.collectorName || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">{recordCount}</td>
                                                    <td className="px-4 py-3 text-slate-700">{revenue.toFixed(2)}</td>
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
           
            <SharedSubmitReportModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onSubmit={handleSubmitReport}
                requiresCollector={true}
                moduleName="Tenant/Lease"
                reportType="Tenant"
                collectors={collectors}
                collectorId={collectorId}
                collectorName={collectorName}
                onCollectorChange={handleCollectorSelection}
                assignedShift={localStorage.getItem("authShift") || "No assigned shift"}
                totalRecords={shiftRecords.length}
                helperText={`Operator: ${operatorName} | As of: ${asOfDateLabel}. Submitted tenant entries remain visible on dashboard.`}
                isSubmitting={isReporting}
                submitDisabled={!collectorId || !collectorName.trim() || shiftRecords.length === 0}
                submitLabel="Confirm Submit"
            />

            <NotificationToast
                isOpen={notificationState.isOpen}
                type={notificationState.type}
                message={notificationState.message}
                onClose={() => setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 })}
            />

            {showSetPriceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-5 border-b pb-3">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Settings size={20} className="text-emerald-600" />
                                {activeTab === "night" ? "Night Market Fee Settings" : "Permanent Slot Fee Settings"}
                            </h3>
                            <button
                                onClick={() => setShowSetPriceModal(false)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-5">
                            Set the new standard rent rate for {activeTab === "night" ? "Night Market" : "Permanent"} tenants. Changes take effect upon saving.
                        </p>

                        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {activeTab === "night"
                                        ? "Night Market Base Price (Per Day, per slot)"
                                        : "Global Permanent Fee"}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                                        ₱
                                    </span>
                                    <input
                                        type="text"
                                        value={activeTab === "night" ? newNightPrice : newPermanentPrice}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, "");
                                            if (activeTab === "night") {
                                                setNewNightPrice(value);
                                            } else {
                                                setNewPermanentPrice(value);
                                            }
                                        }}
                                        className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                {activeTab === "night" && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Night Market Weekly Rent (Per Slot)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                                                ₱
                                            </span>
                                            <input
                                                type="text"
                                                value={newNightWeeklyRent}
                                                onChange={(e) => setNewNightWeeklyRent(e.target.value.replace(/[^0-9.]/g, ""))}
                                                className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                            First due after Start Operation is computed as Base Price x remaining days until week-end; succeeding dues use this weekly rent.
                                        </p>
                                    </div>
                                )}

                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-red-600 mb-3">Overdue Penalty Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Charge (%)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newChargePct}
                                                onChange={(e) => setNewChargePct(e.target.value.replace(/[^0-9.]/g, ""))}
                                                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg font-semibold text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-bold text-slate-500">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Interest (%)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newInterestPct}
                                                onChange={(e) => setNewInterestPct(e.target.value.replace(/[^0-9.]/g, ""))}
                                                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg font-semibold text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-bold text-slate-500">%</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                    Changes here apply to the next overdue cycle and to new tenants. Existing overdue balances keep their current charge and interest rates until that cycle is cleared.
                                </p>

                                {activeTab === "night" && (
                                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <label className="block text-xs font-semibold text-amber-800 mb-1">Max Days Before Termination</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={newNightMaxTerminationDays}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === "") {
                                                        setNewNightMaxTerminationDays("");
                                                        return;
                                                    }
                                                    const parsed = Math.max(1, Math.floor(Number(raw) || 1));
                                                    setNewNightMaxTerminationDays(parsed.toString());
                                                }}
                                                className="w-full bg-white border border-amber-300 px-3 py-2 rounded-lg font-semibold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                                placeholder="e.g., 3"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-amber-700">days</span>
                                        </div>
                                        <p className="text-[10px] text-amber-700 mt-2 leading-tight">
                                            Night Market operations are paused immediately when weekly dues are missed. If still unpaid after this grace period, the tenant account is terminated automatically.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {activeTab !== "night" && (
                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-blue-600 mb-3">Billing Cycle Settings</h4>
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Fee (per day after Start Operation)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">₱</span>
                                            <input
                                                type="text"
                                                value={newDailyFee}
                                                onChange={(e) => setNewDailyFee(e.target.value.replace(/[^0-9.]/g, ""))}
                                                className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2 rounded-lg font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="e.g., 100"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                            This rate applies only after clicking Start Operation and is computed from the next day until the configured due date.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Due Date (Day of the Month)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={newDueDate}
                                                onChange={(e) => {
                                                    let val = parseInt(e.target.value);
                                                    if (val > 31) val = 31;
                                                    if (val < 1) val = 1;
                                                    setNewDueDate(e.target.value === "" ? "" : val.toString());
                                                }}
                                                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="e.g., 5"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                            This establishes the precise day of the month that rent becomes due for all Permanent tenants (e.g., setting "5" ensures rent is always set due on the 5th of the following month upon renewal).
                                        </p>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                            <button
                                onClick={() => setShowSetPriceModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSetPrice}
                                disabled={isSettingPrice || (activeTab === "night" ? (!newNightPrice || !newNightWeeklyRent) : !newPermanentPrice)}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

            {showPaymentRecords && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm">
                    <div className="w-full max-w-6xl xl:max-w-[1240px] rounded-xl bg-white p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col h-[92vh] max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
                      
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Wallet size={20} className="text-emerald-600" />
                                Collection & Payment Records
                            </h3>
                            <button onClick={() => setShowPaymentRecords(false)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-sm">
                                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                                    <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm w-full xl:w-[380px]">
                                        {["Permanent", "Night Market"].map((tenantTab) => (
                                            <button
                                                key={tenantTab}
                                                onClick={() => {
                                                    setPaymentTenantTab(tenantTab);
                                                    setSelectedPaymentTenantId("");
                                                    setPaymentCurrentPage(1);
                                                }}
                                                className={`h-10 sm:h-11 rounded-lg font-bold text-sm transition-all cursor-pointer ${paymentTenantTab === tenantTab ? "bg-white text-emerald-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                {tenantTab}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 w-full xl:w-auto">
                                        <div className="grid grid-cols-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full sm:w-[280px]">
                                            {["Week", "Month", "Year"].map((v) => (
                                                <button
                                                    key={v}
                                                    onClick={() => {
                                                        setPaymentViewType(v);
                                                        setPaymentRefDate(new Date());
                                                    }}
                                                    className={`h-9 sm:h-10 rounded-md font-semibold text-sm transition-all cursor-pointer ${paymentViewType === v ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" : "text-slate-500 hover:text-slate-700"}`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-10 sm:h-11 w-full sm:w-auto sm:min-w-[320px]">
                                            <button onClick={() => handleShiftDate(-1)} className="px-2.5 h-full text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-l-lg transition-colors cursor-pointer border-r border-slate-100">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <div className="px-4 text-sm font-bold text-slate-700 flex items-center gap-2 flex-1 justify-center whitespace-nowrap">
                                                <Calendar size={14} className="text-slate-400" />
                                                {getDisplayRangeText()}
                                            </div>
                                            <button onClick={() => handleShiftDate(1)} className="px-2.5 h-full text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer border-l border-slate-100">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mb-4 flex justify-between items-center shadow-inner">
                            <div>
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Collected</p>
                                <p className="text-3xl font-black text-emerald-800">₱{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Transactions</p>
                                <p className="text-2xl font-black text-emerald-800">{filteredPayments.length}</p>
                            </div>
                        </div>

                        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            {paymentTenantTab === "Night Market" ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Night Market Collection Summary</p>
                                        <h4 className="text-lg font-bold text-slate-800 mt-1">{getDisplayRangeText()}</h4>
                                        <p className="text-sm text-slate-500 mt-1">Night Market uses direct payment records and does not require contract timeline tracking.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                            <p className="text-[11px] uppercase tracking-wide font-bold text-emerald-700">Total Collected</p>
                                            <p className="text-2xl font-black text-emerald-800">₱{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                                            <p className="text-[11px] uppercase tracking-wide font-bold text-cyan-700">Transactions</p>
                                            <p className="text-2xl font-black text-cyan-800">{filteredPayments.length}</p>
                                        </div>
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                            <p className="text-[11px] uppercase tracking-wide font-bold text-emerald-700">Paying Tenants</p>
                                            <p className="text-2xl font-black text-emerald-800">{uniquePayingTenants}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Tenant Payment Visual</p>
                                            <h4 className="text-lg font-bold text-slate-800 mt-1">
                                                {selectedPaymentTenant ? (selectedPaymentTenant.tenantName || selectedPaymentTenant.name) : "No tenant selected"}
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {selectedPaymentTenant
                                                    ? `Slot ${selectedPaymentTenant.slotNo || "N/A"} | ${(selectedPaymentTenant.tenantType || "Permanent")} | Contract: ${paymentProgress?.contractPeriodLabel || "N/A"}`
                                                    : "Select a tenant to view paid and remaining month visuals."}
                                            </p>
                                        </div>

                                       <div className="w-full lg:w-80">
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedPaymentTenantId}
                                                    onChange={(e) => setSelectedPaymentTenantId(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-300 px-3 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer bg-white"
                                                >
                                                    {paymentTenantOptions.length === 0 && <option value="">No tenants found</option>}
                                                    {paymentTenantOptions.map((option) => {
                                                        const tenantName = option.tenant.tenantName || option.tenant.name || "Unnamed Tenant";
                                                        const slotNo = option.tenant.slotNo || "N/A";
                                                        return (
                                                            <option key={option.id} value={option.id}>
                                                                {tenantName} (Slot {slotNo})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPaymentTenant && paymentProgress ? (
                                        <>
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                    <p className="text-[11px] uppercase tracking-wide font-bold text-emerald-700">Paid</p>
                                                    <p className="text-xl font-black text-emerald-800">{paymentProgress.paidMonths}/{paymentProgress.totalMonths} months</p>
                                                    <p className="text-xs font-semibold text-emerald-700 mt-1">₱{paymentProgress.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    {paymentProgress.advancePaidAmount > 0 && (
                                                        <p className="text-[11px] text-emerald-700 mt-1">Advance paid: ₱{paymentProgress.advancePaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    )}
                                                </div>
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <p className="text-[11px] uppercase tracking-wide font-bold text-amber-700">Remaining</p>
                                                    <p className="text-xl font-black text-amber-800">{paymentProgress.remainingMonths} months</p>
                                                    <p className="text-xs font-semibold text-amber-700 mt-1">₱{paymentProgress.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    {paymentProgress.currentCycleAmount > 0 && (
                                                        <p className="text-[11px] text-amber-700 mt-1">Current cycle due: ₱{paymentProgress.currentCycleAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    )}
                                                    {paymentProgress.firstCycleIsProrated && paymentProgress.firstCycleAmount > 0 && (
                                                        <p className="text-[11px] text-amber-700 mt-1">First due (prorated): ₱{paymentProgress.firstCycleAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    )}
                                                </div>
                                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                                                    <p className="text-[11px] uppercase tracking-wide font-bold text-rose-700">Overdue</p>
                                                    <p className="text-xl font-black text-rose-800">{paymentProgress.overdueMonths} month(s)</p>
                                                    <p className="text-xs font-semibold text-rose-700 mt-1">Monthly Due: ₱{paymentProgress.monthlyCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    {paymentProgress.fixedDueDay && (
                                                        <p className="text-[11px] text-rose-700 mt-1">Fixed due day: every {paymentProgress.fixedDueDay}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                                    <span>Lease Progress ({paymentProgress.progressPercent}% Paid)</span>
                                                    <span>{paymentProgress.paidMonths} of {paymentProgress.totalMonths} month(s)</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all"
                                                        style={{ width: `${paymentProgress.progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 overflow-x-auto pb-1">
                                                <div className="min-w-max flex gap-2">
                                                    {paymentProgress.timeline.map((month) => {
                                                        const baseClass = "rounded-lg border p-2 text-center min-h-[82px] flex flex-col justify-between";
                                                        const statusClass = month.status === "paid"
                                                            ? "border-emerald-200 bg-emerald-500 text-white"
                                                            : month.status === "overdue"
                                                                ? "border-rose-200 bg-rose-100 text-rose-800"
                                                                : month.status === "remaining"
                                                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                                                    : "border-slate-200 bg-slate-50 text-slate-400";

                                                        return (
                                                            <div key={month.key} className={`${baseClass} ${statusClass} w-[90px]`}>
                                                                <p className="text-[11px] font-black tracking-wide">{month.label}</p>
                                                                <p className="text-[10px] font-bold uppercase">
                                                                    {month.status === "paid"
                                                                        ? "Paid"
                                                                        : month.status === "overdue"
                                                                            ? "Overdue"
                                                                            : month.status === "remaining"
                                                                                ? "Due"
                                                                                : "N/A"}
                                                                </p>
                                                                <p className="text-[10px] font-semibold">
                                                                    {month.status === "paid"
                                                                        ? `₱${month.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                                        : month.status === "remaining"
                                                                            ? `₱${(month.dueAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                                            : ""}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                                                <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Paid</span>
                                                <span className="px-2 py-1 rounded-md bg-rose-100 text-rose-700">Overdue</span>
                                                <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700">Due / Unpaid</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                                            No payment timeline available for this filter.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <div className="border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="p-3 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">Date & Time</th>
                                        <th className="p-3 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">Tenant Name</th>
                                        <th className="p-3 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">Slot</th>
                                        <th className="p-3 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">Ref / OR No.</th>
                                        <th className="p-3 font-bold text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider text-right">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPayments.length > 0 ? paginatedPayments.map((p, i) => (
                                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-slate-700 font-medium">{new Date(p.datePaid).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                            <td className="p-3 text-slate-800 font-bold">
                                                {p.tenantName}
                                                {p.isDeleted && <span className="text-red-500 text-[10px] ml-2 font-bold">(Deleted)</span>}
                                                {p.status === "Moved Out" && !p.isDeleted && <span className="text-amber-600 text-[10px] ml-2 font-bold">(Moved Out)</span>}
                                            </td>
                                            <td className="p-3 text-slate-600">{p.slotNo}</td>
                                            <td className="p-3 text-slate-500 font-mono text-xs">{p.referenceNo}</td>
                                            <td className="p-3 text-emerald-600 font-black text-right">₱{(Number(p.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                   )) : (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center text-slate-400 font-semibold italic">No payment records found for this {paymentViewType.toLowerCase()}.</td>
                                        </tr>
                                    )}
                               </tbody>
                         </table>
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-2 shrink-0 flex justify-center [&>div]:mt-0 [&>div]:w-full [&>div]:max-w-full">
                            <Pagination
                                currentPage={paymentCurrentPage}
                                totalPages={Math.max(1, Math.ceil(filteredPayments.length / paymentItemsPerPage))}
                                onPageChange={setPaymentCurrentPage}
                                itemsPerPage={paymentItemsPerPage}
                                totalItems={filteredPayments.length}
                                onItemsPerPageChange={(n) => { 
                                    setPaymentItemsPerPage(n); 
                                    setPaymentCurrentPage(1); 
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            )}

            {isMoveOutModalOpen && (
                <MoveOutModal
                    isOpen={isMoveOutModalOpen}
                    onClose={() => setIsMoveOutModalOpen(false)}
                    tenant={tenantToMoveOut}
                    onConfirm={handleMoveOutSubmit}
                />
            )}
            
        </Layout>
    );
};

export default TenantLease;