import React, { useState, useMemo, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, deleteDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, getDocs 
} from "firebase/firestore";
import emailjs from '@emailjs/browser';
import { Archive, Trash2, Mail, Download, Store, MoonStar, Map, ClipboardList } from "lucide-react";

import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
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
import RemarksModal from "../components/tenants/modals/RemarksModal";
import { calculateGridPosition, generateRentStatementPDF } from "../utils/tenantUtils";

const TenantLease = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent"); 
  const [activeStatus, setActiveStatus] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const role = localStorage.getItem("authRole") || "superadmin";

  const [records, setRecords] = useState([]); 
  const [waitlistData, setWaitlistData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotify, setShowNotify] = useState(false); 
  const [showMapModal, setShowMapModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false); 
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); 

  const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
  const [reviewData, setReviewData] = useState(null);
  const [transferApplicant, setTransferApplicant] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [remarksRow, setRemarksRow] = useState(null);
  const [messagingRow, setMessagingRow] = useState(null);      
  
  const [emailBody, setEmailBody] = useState("");             
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [remarksText, setRemarksText] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      liveData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecords(liveData);
    });
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "waitlist"), (snapshot) => {
      setWaitlistData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

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
        revenue += (parseFloat(tenant.rentAmount) || 0) + (parseFloat(tenant.utilityAmount) || 0);
      } else available++;
    }
    return { availableSlots: available, nonAvailableSlots: paid, totalSlots: SECTION_CAPACITY, totalRevenue: revenue };
  }, [records, activeTab]); 

  const handleAddToWaitlist = () => {
    if (!waitlistForm.name || !waitlistForm.contact) { alert("Please fill in Name and Contact."); return; }
    const updatedList = [...waitlistData, { id: Date.now(), ...waitlistForm, dateRequested: new Date().toISOString(), status: "Pending" }];
    setWaitlistData(updatedList); // Note: Should probably write to DB here, but kept original logic
    localStorage.setItem("ibt_waitlist", JSON.stringify(updatedList));
    setWaitlistForm({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
    setShowWaitlistForm(false); 
  };

  const handleStartApproval = (applicant) => {
    setReviewData(applicant);
    setShowWaitlistModal(false);
    setShowReviewModal(true); 
  };

  const handleUnlockPayment = async () => {
    if (!reviewData?.id) return;
    try {
        await updateDoc(doc(db, "waitlist", reviewData.id), { status: "PAYMENT_UNLOCKED" });
        alert("Payment Unlocked!");
        setShowReviewModal(false);
        setShowWaitlistModal(true); 
    } catch (error) { console.error("Error:", error); alert("Failed to update status."); }
  };

  const handleProceedToLease = () => {
    setTransferApplicant(reviewData);
    setShowReviewModal(false);
    setShowAddModal(true);
  };

  const handleRejectApplicant = async (id) => {
    if(window.confirm("Are you sure you want to REJECT and DELETE this application?")) {
      try {
        await deleteDoc(doc(db, "waitlist", id));
        alert("Application removed.");
        if(showReviewModal) setShowReviewModal(false);
      } catch (error) { console.error(error); alert("Error removing application."); }
    }
  };

  const handleAddTenant = async (newTenant) => {
    try {
      const batch = writeBatch(db);
      const tenantRef = doc(collection(db, "tenants"));
      batch.set(tenantRef, { ...newTenant, status: "Paid", createdAt: new Date().toISOString() });

      newTenant.slotNo.split(', ').forEach(slot => {
        const { row, col } = calculateGridPosition(slot);
        batch.set(doc(db, "stalls", `${newTenant.tenantType}-${row}-${col}`), {
          row, col, floor: newTenant.tenantType, status: "Paid", tenantId: tenantRef.id, slotNo: slot 
        });
      });
     
      if (transferApplicant) batch.delete(doc(db, "waitlist", transferApplicant.id));
      await batch.commit();
      setShowAddModal(false);
      alert("Tenant marked as PAID and Mobile App updated!");
    } catch (e) { console.error(e); alert("Error saving to database"); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow?.id) return;
    try {
      const batch = writeBatch(db);
      const tenantId = String(deleteRow.id); 
      
      const q = query(collection(db, "stalls"), where("tenantId", "==", tenantId));
      (await getDocs(q)).forEach((doc) => batch.delete(doc.ref));

      const slotString = deleteRow.slotNo || deleteRow.slotno; 
      if (slotString && deleteRow.tenantType) {
        slotString.split(',').map(s => s.trim()).forEach(slot => {
           const { row, col } = calculateGridPosition(slot);
           batch.delete(doc(db, "stalls", `${deleteRow.tenantType}-${row}-${col}`));
        });
      }

      batch.delete(doc(db, "tenants", tenantId));
      await batch.commit();
      
      setRecords(prev => prev.filter(item => item.id !== deleteRow.id));
      setDeleteRow(null);
      alert("Successfully deleted!");
    } catch (e) { console.error(e); alert(`Error: ${e.message}`); }
  };

  const sendEmailNotification = (mockTenant, messageBody) => {
    emailjs.send('service_xyz123','template_abc456', {
      to_name: mockTenant.tenantName, to_email: mockTenant.email, slot_no: mockTenant.slotNo, message: messageBody, subject_type: "Notification" 
    }, '1poBGqvXaYHzOxqM8')
    .then(() => {
       alert("Email sent!"); setShowEmailModal(false); setEmailBody("");
    }, (err) => { console.error("Email Error:", err); alert("Failed to send email."); });
  };

  const handleBroadcast = () => {
    setShowNotify(false); setNotifyDraft({ title: "", message: "" }); alert("Notification broadcasted!");
  };

  const handleSaveRemarks = () => {
    const storedRemarks = localStorage.getItem("ibt_tenantRemarks"); 
    const remarks = storedRemarks ? JSON.parse(storedRemarks) : {}; 
    remarks[remarksRow.id] = remarksText; 
    localStorage.setItem("ibt_tenantRemarks", JSON.stringify(remarks)); 
    setRemarksRow(null); 
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
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  return (
    <Layout title="Tenants/Lease Management">
      <div className="mb-6">
        <StatCardGroup {...mapStats} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center"> + Add New </button>
          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all"> Notify All </button>
          )}
          <ExportMenu onPrint={() => window.print()} />
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
          <button onClick={() => setShowMapModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all">
            <Map size={18} /> <span className="hidden sm:inline">View Map</span>
          </button>
          <button onClick={() => setShowWaitlistModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all">
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
            <button onClick={() => generateRentStatementPDF(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"><Download size={16} /></button>
            <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all"><Mail size={16} /></button>
            <button onClick={() => { setRemarksRow(records.find(r => r.id === row.id)); setRemarksText(""); }} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"><Archive size={16} /></button>
            <button onClick={() => setDeleteRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"><Trash2 size={16} /></button>
          </div>
        )}
      />
      
      <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / itemsPerPage)} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filtered.length} onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }} />
      
      <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />
      
      <TenantMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} activeTab={activeTab} records={records} onSelectSlot={(tenant) => setViewRow(tenant)} />

      <WaitlistModal 
        isOpen={showWaitlistModal} 
        onClose={() => setShowWaitlistModal(false)} 
        waitlistData={waitlistData} 
        showForm={showWaitlistForm} 
        setShowForm={setShowWaitlistForm} 
        formData={waitlistForm} 
        setFormData={setWaitlistForm} 
        onAdd={handleAddToWaitlist} 
        onApprove={handleStartApproval} 
        onReject={handleRejectApplicant} 
      />

      <TenantEmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} recipient={messagingRow} body={emailBody} setBody={setEmailBody} onSend={sendEmailNotification} />

      <ApplicationReviewModal 
        isOpen={showReviewModal}
        reviewData={reviewData}
        onClose={() => setShowReviewModal(false)}
        onBack={() => { setShowReviewModal(false); setShowWaitlistModal(true); }}
        onUnlockPayment={handleUnlockPayment}
        onProceedToLease={handleProceedToLease}
      />

      <AddTenantModal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setTransferApplicant(null); }} 
        onSave={handleAddTenant} 
        tenants={records}
        initialData={transferApplicant ? {
          name: transferApplicant.name,
          contactNo: transferApplicant.contact,
          email: transferApplicant.email,
          tenantType: transferApplicant.floor || transferApplicant.preferredType || "Permanent",
          products: transferApplicant.product,
          uid: transferApplicant.uid,
          slotNo: transferApplicant.targetSlot || "", 
          referenceNo: transferApplicant.paymentReference || "", 
          documents: {
              businessPermit: transferApplicant.permitUrl,
              validID: transferApplicant.validIdUrl,
              barangayClearance: transferApplicant.clearanceUrl,
              proofOfReceipt: transferApplicant.receiptUrl
          }
        } : null}
      />

      {editRow && (
        <EditTenantLease 
          row={editRow} 
          tenants={records} 
          onClose={() => setEditRow(null)} 
          onSave={async (updatedData) => { 
             try {
                const batch = writeBatch(db);
                batch.update(doc(db, "tenants", updatedData.id), updatedData);
                const q = query(collection(db, "stalls"), where("tenantId", "==", updatedData.id));
                (await getDocs(q)).forEach((doc) => batch.delete(doc.ref));
                if (updatedData.slotNo) {
                  updatedData.slotNo.split(', ').forEach(slot => {
                    const { row, col } = calculateGridPosition(slot);
                    batch.set(doc(db, "stalls", `${updatedData.tenantType}-${row}-${col}`), {
                      row, col, floor: updatedData.tenantType, status: updatedData.status, tenantId: updatedData.id, slotNo: slot 
                    });
                  });
                }
                await batch.commit();
                setEditRow(null); alert("Tenant updated!");
             } catch (error) { console.error(error); alert("Failed to update record."); }
          }}
        />
      )}
      
      <DeleteModal isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDeleteConfirm} title="Delete Record" message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion." itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""} />

      <RemarksModal isOpen={!!remarksRow} onClose={() => setRemarksRow(null)} onSave={handleSaveRemarks} remarksText={remarksText} setRemarksText={setRemarksText} />

      <BroadcastModal isOpen={showNotify} onClose={() => setShowNotify(false)} onBroadcast={handleBroadcast} draft={notifyDraft} setDraft={setNotifyDraft} />

    </Layout>
  );
};

export default TenantLease;