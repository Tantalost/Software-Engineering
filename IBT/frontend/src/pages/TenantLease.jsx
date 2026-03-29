import React, { useState, useMemo, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Archive, Trash2, Mail, Download, Store, MoonStar, Map, ClipboardList, ListChecks, FileText, X, History, Settings, Loader2, CheckCircle, Play, Pause, Wallet, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import LogModal from "../components/common/LogModal";
import NotificationToast from "../components/common/NotificationToast";

import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";
import TenantStatusFilter from "../components/tenants/TenantStatusFilter";
import AddTenantModal from "../components/tenants/modals/AddTenantModal";
import TenantViewModal from "../components/tenants/modals/TenantViewModal";
import TenantMapModal from "../components/tenants/modals/TenantMapModal";
import WaitlistModal from "../components/tenants/modals/WaitlistModal";
import TenantEmailModal from "../components/tenants/modals/TenantEmailModal";
import ApplicationReviewModal from "../components/tenants/modals/ApplicationReviewModal";
import BroadcastModal from "../components/tenants/modals/BroadcastModal";
import ArchiveConfirmModal from "../components/tenants/modals/ArchiveConfirmModal";
import SubmitReportModal from "../components/tenants/modals/SubmitReportModal";

import { generateRentStatementPDF, calculateDueAmount } from "../utils/tenantUtils";
import { logActivity } from "../utils/logger";
import { sendNotification } from "../utils/notificationService.js";
import { submitPageReport } from "../utils/reportService.js";
import { sendBroadcast, archiveTenantRecord, requestBulkDeletion } from "../services/tenantServices.js";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;
const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

const TenantLease = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [activeTab, setActiveTab] = useState("permanent");
    const [activeStatus, setActiveStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const role = localStorage.getItem("authRole") || "superadmin";

    const [records, setRecords] = useState([]);
    const [waitlistData, setWaitlistData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeWaitlistTab, setActiveWaitlistTab] = useState("All");

    const [defaultNightPrice, setDefaultNightPrice] = useState(150);
    const [showSetPriceModal, setShowSetPriceModal] = useState(false);
    const [newNightPrice, setNewNightPrice] = useState("");
    const [isSettingPrice, setIsSettingPrice] = useState(false);
    const [defaultPermanentPrice, setDefaultPermanentPrice] = useState(6000);
    const [newPermanentPrice, setNewPermanentPrice] = useState("");

    const [permChargePct, setPermChargePct] = useState(25);
    const [permInterestPct, setPermInterestPct] = useState(2);
    const [nightChargePct, setNightChargePct] = useState(25);
    const [nightInterestPct, setNightInterestPct] = useState(2);
    
    const [newChargePct, setNewChargePct] = useState("");
    const [newInterestPct, setNewInterestPct] = useState("");

    const [defaultDueDate, setDefaultDueDate] = useState("5");
    const [newDueDate, setNewDueDate] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [showNotify, setShowNotify] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [showWaitlistForm, setShowWaitlistForm] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const [showPaymentRecords, setShowPaymentRecords] = useState(false);
    const [paymentViewType, setPaymentViewType] = useState("Week");
    const [paymentRefDate, setPaymentRefDate] = useState(new Date());
    const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");

    const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);     
    const [paymentItemsPerPage, setPaymentItemsPerPage] = useState(25);

    const [isReporting, setIsReporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
    const [reviewData, setReviewData] = useState(null);
    const [transferApplicant, setTransferApplicant] = useState(null);

    const [viewRow, setViewRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [messagingRow, setMessagingRow] = useState(null);
    const [archiveRow, setArchiveRow] = useState(null);
    const [operationRow, setOperationRow] = useState(null);
    const [toggleOpRow, setToggleOpRow] = useState(null);

    const [emailBody, setEmailBody] = useState("");

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
                    localStorage.setItem("defaultNightPrice", data.defaultPrice.toString());
                }
            } catch (error) {
                console.error("Error fetching default night price:", error);
                const saved = localStorage.getItem("defaultNightPrice");
                if (saved) setDefaultNightPrice(Number(saved));
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
                    if (data.permanentDueDate !== undefined) setDefaultDueDate(data.permanentDueDate.toString());
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
        const currentNewPrice = isNightMarket ? newNightPrice : newPermanentPrice;

        if (!currentNewPrice || isNaN(currentNewPrice)) {
            setNotificationState({ isOpen: true, type: 'error', message: "Please enter a valid price.", autoClose: true, duration: 3000 });
            return;
        }

        const priceValue = Number(currentNewPrice);
        if (priceValue <= 0) {
            setNotificationState({ isOpen: true, type: 'error', message: "Price must be greater than 0.", autoClose: true, duration: 3000 });
            return;
        }

        setIsSettingPrice(true);

        try {
            
            const endpoint = isNightMarket ? '/tenants/update-night-market-prices' : '/tenants/update-permanent-prices';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPrice: priceValue }),
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
                    permanentDueDate: (!isNightMarket && newDueDate) ? Number(newDueDate) : Number(defaultDueDate)
                }),
            });

            if (!overdueResponse.ok) throw new Error("Failed to update overdue settings");

            if (isNightMarket) {
                setDefaultNightPrice(priceValue);
                setNightChargePct(newChargePct ? Number(newChargePct) : nightChargePct);
                setNightInterestPct(newInterestPct ? Number(newInterestPct) : nightInterestPct);
                localStorage.setItem("defaultNightPrice", priceValue.toString());
            } else {
                setDefaultPermanentPrice(priceValue);
                setPermChargePct(newChargePct ? Number(newChargePct) : permChargePct);
                setPermInterestPct(newInterestPct ? Number(newInterestPct) : permInterestPct);
                setDefaultDueDate(newDueDate ? newDueDate : defaultDueDate);
                localStorage.setItem("defaultPermanentPrice", priceValue.toString());
            }

            await fetchTenants();

            await logActivity(
                role,
                "SET_FEES_AND_PENALTIES",
                `Updated rent to ₱${priceValue} and adjusted overdue settings.`,
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
            const res = await fetch(`${API_URL}/tenants`);
            if (!res.ok) throw new Error("Failed to fetch tenants");
            const data = await res.json();
            const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
            formatted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setRecords(formatted);
        } catch (err) {
            console.error("Error fetching tenants:", err);
        }
    };

    const fetchWaitlist = async () => {
        try {
            const res = await fetch(`${API_URL}/waitlist`);
            if (!res.ok) throw new Error("Failed to fetch waitlist");
            const data = await res.json();
            const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
            const activeWaitlist = formatted.filter(app => app.status !== 'TENANT');
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
        const matchesDate = !selectedDate || new Date(t.StartDateTime).toDateString() === new Date(selectedDate).toDateString();
        const matchesStatus = activeStatus === "All" || t.status.toLowerCase() === activeStatus.toLowerCase();
        return matchesSearch && matchesTab && matchesDate && matchesStatus;
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
                        tenantType: t.tenantType || "Permanent"
                    });
                });
            }
        });

        all.sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid));

        const start = new Date(paymentRefDate);
        const end = new Date(paymentRefDate);

        if (paymentViewType === "Week") {
            const day = start.getDay();
            start.setDate(start.getDate() - day); 
            end.setDate(start.getDate() + 6);     
        } else if (paymentViewType === "Month") {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1, 0);  
        } else if (paymentViewType === "Year") {
            start.setMonth(0, 1);
            end.setMonth(11, 31);
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const filtered = all.filter(p => {
            const pDate = new Date(p.datePaid);
            const isWithinDate = pDate >= start && pDate <= end;
            const isTypeMatch = paymentTypeFilter === "All" || p.tenantType === paymentTypeFilter;
            return isWithinDate && isTypeMatch;
        });

        return { dateRange: { start, end }, filteredPayments: filtered };
    }, [records, paymentViewType, paymentRefDate, paymentTypeFilter]);

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

    const paginatedPayments = useMemo(() => {
        const start = (paymentCurrentPage - 1) * paymentItemsPerPage;
        return filteredPayments.slice(start, start + paymentItemsPerPage);
    }, [filteredPayments, paymentCurrentPage, paymentItemsPerPage]);

   
    useEffect(() => {
        setPaymentCurrentPage(1);
    }, [paymentViewType, paymentRefDate, paymentTypeFilter]);
   
    const handleSubmitReport = async () => {
        setIsReporting(true);
        try {
            const formattedData = filtered.map(t => ({
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
                filters: {
                    searchQuery,
                    activeTab,
                    activeStatus,
                    dateFilter: selectedDate || "None"
                },
                statistics: {
                    totalRecords: records.length,
                    displayedRecords: filtered.length,
                    totalRevenue: mapStats.totalRevenue,
                    occupancy: `${mapStats.nonAvailableSlots}/${mapStats.totalSlots}`,
                    collector: adminName 
                },
                data: formattedData
            };

            await submitPageReport("Tenant Lease", reportPayload, adminName);
            await sendNotification(
                "Report Submitted: Tenant Lease",
                `A Tenant Lease report was submitted by ${role === 'lease' ? 'Tenant Admin' : 'Admin'}.`,
                "Tenants",
                "superadmin"
            );

            await logActivity(role, "SUBMIT_REPORT", "Submitted Tenant Lease Report", "Tenants");

            setNotificationState({
                isOpen: true,
                type: 'success',
                message: "Report submitted successfully!",
                autoClose: true,
                duration: 3000
            });

            setShowSubmitModal(false);

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

                await sendNotification(
                    "Deletion Request: Tenants",
                    `Tenant Admin has requested to delete ${selectedIds.length} tenant records.`,
                    "Tenants",
                    "superadmin"
                );

                await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} tenants`, "Tenants");

                setNotificationState({
                    isOpen: true,
                    type: 'success',
                    message: `Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`,
                    autoClose: true,
                    duration: 3000
                });
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
                if (key === 'documents') return;
                formData.append(key, newTenant[key]);
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

    const handleApproveRenewal = async (id) => {
        try {
            const res = await fetch(`${API_URL}/tenants/${id}/approve-renewal`, { method: 'PUT' });
            if (res.ok) {
                setNotificationState({ isOpen: true, type: 'success', message: "Renewal payment confirmed! Next due date updated.", autoClose: true, duration: 3000 });
            
                await logActivity(role, "APPROVE_RENEWAL", `Approved renewal payment for tenant ID #${id}`, "Tenants");
            
                setShowReviewModal(false);
                fetchTenants(); 
            } else {
                setNotificationState({ isOpen: true, type: 'error', message: "Failed to approve renewal.", autoClose: true, duration: 3000 });
            }
        } catch (err) {
            setNotificationState({ isOpen: true, type: 'error', message: "Server error approving renewal.", autoClose: true, duration: 3000 });
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
            if (!res.ok) throw new Error("Failed to start operation");

            setNotificationState({ isOpen: true, type: 'success', message: "Operation officially started!", autoClose: true, duration: 3000 });
            await logActivity(role, "START_OPERATION", `Started operation for tenant: ${tenantName}`, "Tenants");
            
            setOperationRow(null); 
            fetchTenants();        
        } catch (e) {
            console.error(e);
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to start operation.", autoClose: true, duration: 3000 });
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
            if (!res.ok) throw new Error("Failed to toggle operation");

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
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to update operation status.", autoClose: true, duration: 3000 });
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
        doc.text(`Collector: ${localStorage.getItem("authName") || "Tenant Admin"}`, 15, 61);

       
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

            const adminName = localStorage.getItem("authName") || localStorage.getItem("authEmail") || (role === "lease" ? "Tenant Admin" : "Admin");

            worksheet.addRow([]); 
            worksheet.addRow([`Date: ${new Date().toLocaleDateString()}`, '', '', '', '', '', '', '', '', `No. of Payments: ${filtered.length}`]);
            worksheet.addRow([`Collector: ${adminName}`, '', '', '', '', '', '', '', '', '']); 
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
        if (filtered.length === 0) return alert("No records to export.");

        const doc = new jsPDF("l", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("TENANTS AND LEASE REPORTS", pageWidth / 2, 45, { align: "center" });

        const adminName = localStorage.getItem("authName") || localStorage.getItem("authEmail") || (role === "lease" ? "Tenant Admin" : "Admin");

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);
        doc.text(`Collector: ${adminName}`, 15, 61); // <-- NEW

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
            head: [["Slot", "Name", "Email", "Contact", "Rent", "Elec", "Other", "Util Total", "Total Due"]],
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
            "Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"
        ]
        : ["Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"];

    const actionRequiredCount = waitlistData.filter(app => !app.adminViewed && app.status !== 'TENANT').length;

    const renewalsPendingCount = records.filter(t => t.status === "Payment Review" || t.status === "PAYMENT_REVIEW").length;

    return (
        <Layout title="Tenants/Lease Management">
            <div className="mb-6">
                <StatCardGroup {...mapStats} />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
                <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
                    {(role === "lease") && (
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            disabled={isReporting}
                            className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Submit Report</span>
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
                                    setNewChargePct(nightChargePct.toString());
                                    setNewInterestPct(nightInterestPct.toString());
                                } else {
                                    setNewPermanentPrice(defaultPermanentPrice.toString());
                                    setNewChargePct(permChargePct.toString());
                                    setNewInterestPct(permInterestPct.toString());
                                    setNewDueDate(defaultDueDate.toString());
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

                    <ExportMenu
                        onPrint={() => window.print()}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                </div>
            </div>

            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
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

                <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2 w-full xl:w-auto">
                    <TenantStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
                    {(role === "superadmin" || role === "lease") && (
                        <button
                            onClick={() => setShowLogModal(true)}
                            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-3 sm:px-4 h-10 rounded-xl shadow-sm hover:border-slate-300 transition-all"
                            title="View Logs"
                        >
                            <History size={18} />
                            <span className="hidden sm:inline cursor-pointer">Logs</span>
                        </button>
                    )}

                    {(role === "superadmin" || role === "lease") && (
                        <button
                            onClick={() => setShowPaymentRecords(true)}
                            className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-3 sm:px-4 h-10 rounded-xl shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
                            title="View Payment Records"
                        >
                            <Wallet size={18} />
                            <span className="hidden sm:inline">Records</span>
                        </button>
                    )}

                    {isSelectionMode && selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
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
                            className={`flex items-center justify-center cursor-pointer h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${isSelectionMode
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                        >
                            {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {renewalsPendingCount > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-700">
                        <ClipboardList size={20} />
                        <span className="font-semibold">Action Required: You have {renewalsPendingCount} pending lease renewal(s) awaiting payment verification.</span>
                    </div>
                    <button 
                        onClick={() => { setActiveWaitlistTab("Renewals"); setShowWaitlistModal(true); }}
                        className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                        View Renewals
                    </button>
                </div>
            )}

            <Table
                columns={tableColumns}
                data={paginatedData.map((t) => {
                    const baseData = {
                        id: t.id,
                        slotno: t.slotNo,
                        refno: t.referenceNo || t.referenceno || (t.paymentHistory && t.paymentHistory.length > 0 ? t.paymentHistory[t.paymentHistory.length - 1].referenceNo : "-"),
                        name: t.tenantName || t.name,
                        email: t.email,
                        contactno: t.contactNo,
                        startdate: formatDate(t.StartDateTime),
                        duedate: formatDate(t.DueDateTime || t.EndDateTime),
                        rent: t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-",
                        util: t.utilityAmount ? `₱${t.utilityAmount.toLocaleString()}` : "₱0",
                        totaldue: `₱${(t.totalAmount || calculateDueAmount(t)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        status: t.status,
                    };

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

                            <TableActions onView={() => setViewRow(records.find(r => r.id === row.id))} onEdit={() => setEditRow(records.find(r => r.id === row.id))} onDelete={() => setDeleteRow(records.find(r => r.id === row.id))} />
                            <button onClick={() => handleSingleExportPDF(fullRecord)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer" title="Rent Statement"><Download size={16} /></button>
                            <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all cursor-pointer" title="Send Email"><Mail size={16} /></button>
                            <button onClick={() => setArchiveRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all cursor-pointer" title="Archive Record"><Archive size={16} /></button>
                            {(role === "superadmin") && (
                                <button onClick={() => setDeleteRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                            )}
                        </div>
                    )
                }}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filtered.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
                onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />

            <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />
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

                renewalsData={records.filter(t => t.status === "Payment Review" || t.status === "PAYMENT_REVIEW")}
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
                onClose={() => setShowReviewModal(false)}
                onBack={() => { 
                  setShowReviewModal(false); 
                  if (!reviewData.tenantName) setShowWaitlistModal(true); 
                }}
                onUnlockPayment={handleUnlockPayment}
                onRequestContract={handleRequestContract}
                onProceedToLease={handleProceedToLease}
                onReject={handleRejectApplicant}
                onApproveRenewal={handleApproveRenewal} 
            />

            <AddTenantModal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setTransferApplicant(null); }}
                onSave={handleAddTenant}
                tenants={records}
                activeTab={activeTab}
                defaultNightPrice={defaultNightPrice}
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
                                if (key === 'documents') return;
                                formData.append(key, updatedData[key]);
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
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion."
                itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""}
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
           
            <SubmitReportModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onSubmit={handleSubmitReport}
                isReporting={isReporting}
                recordCount={filtered.length}
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

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Global {activeTab === "night" ? "Night Market" : "Permanent"} Fee
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
                                    Updating these percentages will immediately recalculate the total due for all currently overdue tenants.
                                </p>
                            </div>

                            {activeTab !== "night" && (
                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-blue-600 mb-3">Billing Cycle Settings</h4>
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
                                disabled={isSettingPrice || (activeTab === "night" ? !newNightPrice : !newPermanentPrice)}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Wallet size={20} className="text-emerald-600" />
                                Collection & Payment Records
                            </h3>
                            <button onClick={() => setShowPaymentRecords(false)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-5">
                            
                            <div className="flex flex-wrap items-center gap-3">
                                
                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
                                    {["Week", "Month", "Year"].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => { setPaymentViewType(v); setPaymentRefDate(new Date()); }}
                                            className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all cursor-pointer ${paymentViewType === v ? "bg-white text-emerald-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-9">
                                    <button onClick={() => handleShiftDate(-1)} className="px-2 h-full text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-l-lg transition-colors cursor-pointer border-r border-slate-100">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="px-4 text-sm font-bold text-slate-700 flex items-center gap-2 min-w-[180px] justify-center">
                                        <Calendar size={14} className="text-slate-400" />
                                        {getDisplayRangeText()}
                                    </div>
                                    <button onClick={() => handleShiftDate(1)} className="px-2 h-full text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer border-l border-slate-100">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                          
                            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200 shadow-sm">
                                {["All", "Permanent", "Night Market"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setPaymentTypeFilter(t)}
                                        className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${paymentTypeFilter === t ? "bg-white text-emerald-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mb-4 flex justify-between items-center shadow-inner">
                            <div>
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Collected ({paymentViewType})</p>
                                <p className="text-3xl font-black text-emerald-800">₱{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Transactions</p>
                                <p className="text-2xl font-black text-emerald-800">{filteredPayments.length}</p>
                            </div>
                        </div>

                        <div className="overflow-y-auto border border-slate-200 rounded-xl flex-1 custom-scrollbar">
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
                                            <td className="p-3 text-slate-800 font-bold">{p.tenantName}</td>
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

                        <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
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
            )}
            
        </Layout>
    );
};

export default TenantLease;