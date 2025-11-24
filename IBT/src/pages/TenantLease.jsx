import React, { useState, useMemo, useEffect } from "react";
import { db } from "../firebaseConfig";
// FIX 1: Added onSnapshot and writeBatch to imports
// Update this line at the top of your file
import { 
  collection, 
  updateDoc, 
  doc, 
  onSnapshot, 
  writeBatch, 
  query,     // <--- Add this
  where,     // <--- Add this
  getDocs    // <--- Add this
} from "firebase/firestore";

import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";

import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Textarea from "../components/common/Textarea"; 
import Input from "../components/common/Input"; 
import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";

import TenantStatusFilter from "../components/tenants/TenantStatusFilter"; 
import AddTenantModal from "../components/tenants/modals/AddTenantModal"; 
import { Archive, Trash2, Mail, Download, Store, MoonStar, Map, ClipboardList } from "lucide-react";
import emailjs from '@emailjs/browser';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TenantViewModal from "../components/tenants/modals/TenantViewModal";
import TenantMapModal from "../components/tenants/modals/TenantMapModal";
import WaitlistModal from "../components/tenants/modals/WaitlistModal";
import TenantEmailModal from "../components/tenants/modals/TenantEmailModal";

// FIX 2: Defined mockTenants to prevent "mockTenants is not defined" error
const mockTenants = [];

const TenantLease = () => {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent"); 
  const [activeStatus, setActiveStatus] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const role = localStorage.getItem("authRole") || "superadmin";

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotify, setShowNotify] = useState(false); 
  const [showMapModal, setShowMapModal] = useState(false);

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistData, setWaitlistData] = useState([]);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false); 
  const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [remarksRow, setRemarksRow] = useState(null);
  
  const [showEmailModal, setShowEmailModal] = useState(false); 
  const [messagingRow, setMessagingRow] = useState(null);      
  const [emailBody, setEmailBody] = useState("");             
  
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });

  const [remarksText, setRemarksText] = useState("");
  const [alerts, setAlerts] = useState([]);

  const loadStored = () => {
    const saved = localStorage.getItem("ibt_MockTenantLease");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(savedItem => {
          const freshData = mockTenants.find(t => t.id === savedItem.id);
          return {
            ...savedItem,
            rentAmount: savedItem.rentAmount ?? freshData?.rentAmount ?? 0,
            utilityFee: savedItem.utilityAmount ?? savedItem.utilityFee ?? freshData?.utilityFee ?? 0,
            leaseStart: savedItem.StartDateTime ?? freshData?.StartDateTime,
            leaseEnd: savedItem.DueDateTime ?? freshData?.DueDateTime,
          };
        });
      } catch (e) { return mockTenants; }
    }
    return mockTenants; 
  };

  const [records, setRecords] = useState([]); 

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id 
      }));
      setRecords(liveData);
    });

    return () => unsubscribe(); 
  }, []);

  const calculateGridPosition = (slotName) => {
    if (!slotName) return { row: 0, col: 0 };
    
    const numPart = parseInt(slotName.split('-')[1]); 
    const index = numPart > 100 ? numPart - 101 : numPart - 1; 

    const row = Math.floor(index / 5) + 1;
    const col = (index % 5) + 1;
    
    return { row, col };
  };

  useEffect(() => {
    if (showWaitlistModal) {
      const savedWaitlist = localStorage.getItem("ibt_waitlist");
      if (savedWaitlist)  setWaitlistData(JSON.parse(savedWaitlist));
    }
  }, [showWaitlistModal]);

  const mapStats = useMemo(() => {
    let available = 0; let paid = 0; let revenue = 0;
    const SECTION_CAPACITY = 30; 

    for (let i = 0; i < SECTION_CAPACITY; i++) {
      let slotLabel = activeTab === "permanent" ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`;
      const tenant = records.find(r => 
        (r.slotNo === slotLabel || r.slotno === slotLabel) && 
        (activeTab === "permanent" ? (r.tenantType === "Permanent" || !r.tenantType) : r.tenantType === "Night Market")
      );

      if (tenant && tenant.status !== "Available") {
        paid++;
        const rent = parseFloat(tenant.rentAmount) || 0;
        const util = parseFloat(tenant.utilityAmount) || 0;
        revenue += (rent + util);
      } else {
        available++;
      }
    }
    return { availableSlots: available, nonAvailableSlots: paid, totalSlots: SECTION_CAPACITY, totalRevenue: revenue };
  }, [records, activeTab]); 

  const { availableSlots, nonAvailableSlots, totalSlots, totalRevenue } = mapStats;

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_MockTenantLease", JSON.stringify(next));
  };

  const persistWaitlist = (next) => {
    setWaitlistData(next);
    localStorage.setItem("ibt_waitlist", JSON.stringify(next));
  };

  const handleAddToWaitlist = () => {
    if (!waitlistForm.name || !waitlistForm.contact) { alert("Please fill in Name and Contact number."); return; }
    const newEntry = { id: Date.now(), ...waitlistForm, dateRequested: new Date().toISOString(), status: "Pending" };
    const updatedList = [...waitlistData, newEntry];
    persistWaitlist(updatedList);
    setWaitlistForm({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
    setShowWaitlistForm(false); 
  };

  const handleApproveApplicant = (applicant) => {
    const newTenant = {
        id: `tenant-${Date.now()}`,
        slotNo: "TBD", 
        tenantName: applicant.name,
        contactNo: applicant.contact,
        email: applicant.email,
        tenantType: applicant.preferredType,
        status: "Paid", 
        StartDateTime: new Date().toISOString(),
        DueDateTime: "", 
        rentAmount: 0,
        utilityAmount: 0,
        products: applicant.notes
    };
    const updatedRecords = [newTenant, ...records];
    persist(updatedRecords);
    const updatedWaitlist = waitlistData.filter(item => item.id !== applicant.id);
    persistWaitlist(updatedWaitlist);
    alert(`${applicant.name} has been approved. Please edit their record to assign a Slot Number.`);
  };

  const handleRejectApplicant = (id) => {
    if(window.confirm("Are you sure you want to remove this applicant?")) {
        const updatedWaitlist = waitlistData.filter(item => item.id !== id);
        persistWaitlist(updatedWaitlist);
    }
  };

  const getDaysDiff = (dateString) => {
    const today = new Date();
    const target = new Date(dateString);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24)); 
  };

  useEffect(() => {
    const newAlerts = [];
    records.forEach(mockTenant => {
      if (mockTenant.DueDateTime) {
        const daysLeft = getDaysDiff(mockTenant.DueDateTime);
        if (daysLeft > 0 && daysLeft <= 30) {
          newAlerts.push({ id: mockTenant.id, type: "renewal", msg: `Renewal Warning: ${mockTenant.tenantName || mockTenant.name} (Slot ${mockTenant.slotNo}) expires in ${daysLeft} days.` });
        }
      }
    });
    setAlerts(newAlerts);
  }, [records]);

 const handleAddTenant = async (newTenant) => {
    try {
      const batch = writeBatch(db);

      // 1. Create Tenant Document with status "Paid"
      const tenantRef = doc(collection(db, "tenants"));
      batch.set(tenantRef, {
        ...newTenant,
        status: "Paid", // <--- Ensures Admin Table says "Paid"
        createdAt: new Date().toISOString()
      });

      // 2. Update Stall Document(s) with status "Paid"
      // This is CRITICAL for the Mobile App to turn the slot RED
      const slots = newTenant.slotNo.split(', '); 
      
      slots.forEach(slot => {
        const { row, col } = calculateGridPosition(slot);
        
        // Reconstruct ID (e.g., "Permanent-1-1")
        const stallId = `${newTenant.tenantType}-${row}-${col}`;
        const stallRef = doc(db, "stalls", stallId);
        
        batch.set(stallRef, {
          row: row,
          col: col,
          floor: newTenant.tenantType, 
          status: "Paid",     // <--- Mobile App specifically looks for "Paid"
          tenantId: tenantRef.id,
          slotLabel: slot
        });
      });

      await batch.commit();
      
      setShowAddModal(false);
      alert("Tenant marked as PAID and Mobile App updated!");
    } catch (e) {
      console.error("Error adding tenant: ", e);
      alert("Error saving to database");
    }
  };

 const handleDeleteConfirm = async () => {
    if (!deleteRow || !deleteRow.id) return;

    try {
      const batch = writeBatch(db);
      const tenantId = String(deleteRow.id); 
      
      // Tracker to ensure we don't try to delete the same document twice
      const stallIdsToDelete = new Set();

      // --- STRATEGY 1: Find Stalls linked by ID (The Modern Way) ---
      const q = query(
        collection(db, "stalls"), 
        where("tenantId", "==", tenantId)
      );
      const stallSnapshot = await getDocs(q);
      stallSnapshot.forEach((doc) => {
        stallIdsToDelete.add(doc.id);
      });

      // --- STRATEGY 2: Calculate Stall ID manually (The Fallback) ---
      // This catches cases where the 'tenantId' link is missing in the database
      const slotString = deleteRow.slotNo || deleteRow.slotno; // Handle case sensitivity
      const typeString = deleteRow.tenantType; 

      if (slotString && typeString) {
        const slots = slotString.split(',').map(s => s.trim());
        slots.forEach(slot => {
           // Use your existing helper to get row/col
           const { row, col } = calculateGridPosition(slot);
           
           // Reconstruct the ID exactly how handleAddTenant creates it
           const calculatedId = `${typeString}-${row}-${col}`;
           stallIdsToDelete.add(calculatedId);
        });
      }

      // --- EXECUTE DELETIONS ---
      
      // 1. Delete the Tenant
      batch.delete(doc(db, "tenants", tenantId));

      // 2. Delete every Stall we found (via Link OR Calculation)
      stallIdsToDelete.forEach(stallId => {
        const stallRef = doc(db, "stalls", stallId);
        batch.delete(stallRef);
      });

      console.log("Deleting Tenant:", tenantId);
      console.log("Deleting Stalls:", Array.from(stallIdsToDelete));

      await batch.commit();
      
      // Update UI
      setRecords(currentRecords => currentRecords.filter(item => item.id !== deleteRow.id));
      setDeleteRow(null);
      alert("Successfully deleted from Database and Mobile App!");
      
    } catch (e) {
      console.error("Error deleting:", e);
      alert(`Error: ${e.message}`);
    }
  };

  const sendEmailNotification = (mockTenant, messageBody) => {
    const templateParams = {
      to_name: mockTenant.tenantName || mockTenant.name,
      to_email: mockTenant.email,
      slot_no: mockTenant.slotNo,
      message: messageBody,
      subject_type: "Notification" 
    };
    emailjs.send('service_xyz123','template_abc456', templateParams, '1poBGqvXaYHzOxqM8')
    .then(() => {
       alert(`Email successfully sent to ${mockTenant.tenantName || mockTenant.name}`);
       setShowEmailModal(false);
       setEmailBody("");
    }, (err) => {
       console.error("Email Error:", err);
       alert("Failed to send email. Check console.");
    });
  };

  const handleDownloadStatement = (mockTenant) => {
    const doc = new jsPDF();
    const themeColor = [16, 185, 129]; 
    doc.setFontSize(22); doc.setTextColor(...themeColor); doc.setFont("helvetica", "bold"); doc.text("IBT MANAGEMENT", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("Integrated Bus Terminal, Zamboanga City", 14, 26); doc.text("admin@ibt.gov.ph | (062) 991-0000", 14, 31);
    doc.setFillColor(...themeColor); doc.rect(140, 10, 55, 22, 'F');
    doc.setTextColor(255); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("RENT STATEMENT", 145, 23);
    doc.setTextColor(0); doc.setFontSize(11);
    doc.text(`Bill To: ${mockTenant.tenantName || mockTenant.name}`, 14, 50); doc.text(`Slot: ${mockTenant.slotNo}`, 14, 56);
    const dateObj = new Date(); doc.text(`Date: ${dateObj.toLocaleDateString()}`, 140, 50);
    const rent = mockTenant.rentAmount || 0; const util = mockTenant.utilityAmount || 0; const total = rent + util;
    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Reference', 'Amount']],
      body: [
        ['Rent Fee', `Slot ${mockTenant.slotNo}`, rent.toLocaleString('en-PH')],
        ['Utility - Electricity', 'Fixed Rate', util.toLocaleString('en-PH')],
      ],
      theme: 'grid',
      headStyles: { fillColor: themeColor, textColor: 255, fontStyle: 'bold' },
      foot: [['', 'TOTAL DUE', total.toLocaleString('en-PH')]],
    });
    doc.save(`Statement_${mockTenant.tenantName || mockTenant.name}.pdf`);
  };


  const filtered = records.filter((t) => {
    const name = t.tenantName || t.name || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.referenceNo || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "permanent" ? (t.tenantType === "Permanent" || !t.tenantType) : t.tenantType === "Night Market"; 
    const matchesDate = !selectedDate || new Date(t.StartDateTime).toDateString() === new Date(selectedDate).toDateString(); 
    const matchesStatus = activeStatus === "All" || t.status.toLowerCase() === activeStatus.toLowerCase();
    return matchesSearch && matchesTab && matchesDate && matchesStatus;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Tenants/Lease Management">
      <div className="mb-6">
        <StatCardGroup availableSlots={availableSlots} nonAvailableSlots={nonAvailableSlots} totalSlots={totalSlots} totalRevenue={totalRevenue} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center"> + Add New </button>
          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all"> Notify All </button>
          )}
          <div className="flex items-center justify-end">
            <ExportMenu onExportCSV={() => {}} onExportExcel={() => {}} onExportPDF={() => {}} onPrint={() => window.print()} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200">
            <button onClick={() => setActiveTab("permanent")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === "permanent" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
              <Store size={18} /> <span className="hidden sm:inline">Permanent</span>
            </button>
            <button onClick={() => setActiveTab("night")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === "night" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
              <MoonStar size={18} /> <span className="hidden sm:inline">Night Market</span>
            </button>
          </div>
          <button onClick={() => setShowMapModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all" title="View Map">
            <Map size={18} /> <span className="hidden sm:inline">View Map</span>
          </button>
          <button onClick={() => setShowWaitlistModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all" title="Manage Waitlist">
            <ClipboardList size={18} /> <span className="hidden sm:inline">Waitlist</span>
            {waitlistData.length > 0 && (<span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{waitlistData.length}</span>)}
          </button>
        </div>
        <TenantStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
      </div>

      <Table
        columns={["Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"]}
        data={paginatedData.map((t) => ({
          id: t.id,
          slotno: t.slotNo,
          refno: t.referenceNo || t.referenceno,
          name: t.tenantName || t.name,
          email: t.email,
          contactno: t.contactNo,
          startdate: t.StartDateTime || "-",
          duedate: t.DueDateTime || t.EndDateTime || "-",
          rent: t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-",
          util: t.utilityAmount ? `₱${t.utilityAmount.toLocaleString()}` : "₱0",
          totaldue: t.totalAmount ? `₱${t.totalAmount.toLocaleString()}` : (t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-"),
          status: t.status,
        }))}
        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <TableActions onView={() => setViewRow(records.find(r => r.id === row.id))} onEdit={() => setEditRow(records.find(r => r.id === row.id))} onDelete={() => setDeleteRow(records.find(r => r.id === row.id))} />
            <button onClick={() => handleDownloadStatement(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"><Download size={16} /></button>
            <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all"><Mail size={16} /></button>
            <button onClick={() => handleArchive(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"><Archive size={16} /></button>
            <button onClick={() => setDeleteRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"><Trash2 size={16} /></button>
          </div>
        )}
      />
      
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filtered.length} onItemsPerPageChange={(newItemsPerPage) => { setItemsPerPage(newItemsPerPage); setCurrentPage(1); }} />

      <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />

      <TenantMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} activeTab={activeTab} records={records} onSelectSlot={(tenant) => setViewRow(tenant)} />

      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} waitlistData={waitlistData} showForm={showWaitlistForm} setShowForm={setShowWaitlistForm} formData={waitlistForm} setFormData={setWaitlistForm} onAdd={handleAddToWaitlist} onApprove={handleApproveApplicant} onReject={handleRejectApplicant} />

      <TenantEmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} recipient={messagingRow} body={emailBody} setBody={setEmailBody} onSend={sendEmailNotification} />

      <AddTenantModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddTenant} tenants={records} />

      {editRow && (
        <EditTenantLease 
          row={editRow} 
          tenants={records} 
          onClose={() => setEditRow(null)} 
          onSave={async (updatedData) => {
            try {
              const batch = writeBatch(db);
              const tenantId = updatedData.id;

              // 1. Update the Tenant Document (Main Data)
              const tenantRef = doc(db, "tenants", tenantId);
              batch.update(tenantRef, updatedData);

              // 2. Find and DELETE existing stalls for this tenant
              // (This cleans up the old slot if you moved the tenant)
              const q = query(collection(db, "stalls"), where("tenantId", "==", tenantId));
              const oldStallsSnapshot = await getDocs(q);
              oldStallsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
              });

              // 3. Create NEW Stall Documents for the updated slots
              // (This ensures the Mobile App sees the correct new Status and Location)
              if (updatedData.slotNo) {
                const slots = updatedData.slotNo.split(', ');
                
                slots.forEach(slot => {
                  // Calculate Row/Col for the Mobile App Grid
                  const { row, col } = calculateGridPosition(slot);
                  
                  // Create the Stall ID (e.g. Permanent-1-1)
                  const stallId = `${updatedData.tenantType}-${row}-${col}`;
                  const stallRef = doc(db, "stalls", stallId);

                  batch.set(stallRef, {
                    row: row,
                    col: col,
                    floor: updatedData.tenantType,
                    status: updatedData.status, // <--- Syncs "Paid" to Mobile App
                    tenantId: tenantId,
                    slotLabel: slot
                  });
                });
              }

              // 4. Commit all changes at once
              await batch.commit();
              
              setEditRow(null);
              alert("Tenant updated! Mobile App synced successfully.");
              
            } catch (error) {
              console.error("Error updating tenant: ", error);
              alert("Failed to update record.");
            }
          }}
        />
      )}
      
      <DeleteModal isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDeleteConfirm} title="Delete Record" message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion." itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""} />

      {remarksRow && role === "superadmin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Internal Remarks</h3>
            <Textarea label="Admin Notes" value={remarksText} onChange={(e) => setRemarksText(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setRemarksRow(null); setRemarksText(""); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { 
                const storedRemarks = localStorage.getItem("ibt_tenantRemarks"); 
                const remarks = storedRemarks ? JSON.parse(storedRemarks) : {}; 
                remarks[remarksRow.id] = remarksText; 
                localStorage.setItem("ibt_tenantRemarks", JSON.stringify(remarks)); 
                setRemarksRow(null); 
              }} className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white shadow hover:bg-amber-700">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {role === "superadmin" && showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">System Notification</h3>
            <div className="space-y-3">
              <Input label="Title" value={notifyDraft.title} onChange={(e) => setNotifyDraft({ ...notifyDraft, title: e.target.value })} />
              <Textarea label="Body" value={notifyDraft.message} onChange={(e) => setNotifyDraft({ ...notifyDraft, message: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowNotify(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { setShowNotify(false); setNotifyDraft({ title: "", message: "" }); alert("Notification broadcasted!"); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Broadcast</button>
            </div>
          </div>
        </div>
      )}


    </Layout>

  );
};

export default TenantLease;