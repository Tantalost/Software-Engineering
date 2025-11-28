import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import Textarea from "../components/common/Textarea";
import { Check, X, Eye, AlertCircle, MessageSquare, Loader2 } from "lucide-react"; 
import { logActivity } from "../utils/logger"; 

const API_URL = "http://localhost:3000/api"; 

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
      </div>
      {children}
    </div>
  </div>
);

const DeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [viewData, setViewData] = useState(null); 
  const [approveData, setApproveData] = useState(null);
  const [denyData, setDenyData] = useState(null); 
  const [adminRemarks, setAdminRemarks] = useState("");

  const role = localStorage.getItem("authRole") || "superadmin";

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/deletion-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return requests.slice(startIndex, startIndex + itemsPerPage);
  }, [requests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(requests.length / itemsPerPage);

  const handleApprove = async () => {
    if (!approveData || !adminRemarks) return;

    try {
      const res = await fetch(`${API_URL}/deletion-requests/${approveData._id || approveData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            action: "approve", 
            adminRemarks 
        })
      });

      if (!res.ok) throw new Error("Approval failed");

      await logActivity(role, "APPROVE_DELETE", `Approved deletion of ${approveData.itemDescription}`, "DeletionRequests");

      setApproveData(null);
      setAdminRemarks("");
      fetchRequests(); 

    } catch (e) {
      console.error("Approve Error", e);
      alert("Failed to approve request.");
    }
  };

  const handleDeny = async () => {
    if (!denyData || !adminRemarks) return;

    try {
      const res = await fetch(`${API_URL}/deletion-requests/${denyData._id || denyData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            action: "deny", 
            adminRemarks 
        })
      });

      if (!res.ok) throw new Error("Denial failed");

      await logActivity(role, "DENY_DELETE", `Denied deletion of ${denyData.itemDescription}`, "DeletionRequests");

      setDenyData(null);
      setAdminRemarks("");
      fetchRequests(); 

    } catch (e) {
      console.error("Deny Error", e);
      alert("Failed to deny request.");
    }
  };

  return (
    <Layout title="Deletion Requests">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r flex items-start gap-3">
        <AlertCircle className="text-amber-600 mt-0.5" size={20} />
        <div>
          <p className="font-semibold text-amber-800">Admin Approval Required</p>
          <p className="text-sm text-amber-700">Review pending deletion requests from Ticket Admins.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : (
        <Table
            columns={["Item Type", "Description", "Requested By", "Reason", "Date"]}
            data={paginatedData.map((req) => ({
            itemtype: req.itemType,           
            description: req.itemDescription, 
            requestedby: req.requestedBy,
            reason: req.reason || "N/A",     
            date: new Date(req.requestDate).toLocaleString(), 
            id: req._id || req.id
            }))}
            emptyMessage="No pending deletion requests."
            actions={(row) => {
            const fullReq = requests.find(r => (r._id === row.id) || (r.id === row.id));
            return (
                <div className="flex justify-end space-x-2">
                    <button
                    onClick={() => setViewData(fullReq)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    title="View Details"
                    >
                    <Eye size={18} />
                    </button>
                    <button
                    onClick={() => { setApproveData(fullReq); setAdminRemarks(""); }}
                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                    title="Approve"
                    >
                    <Check size={18} />
                    </button>

                    <button
                    onClick={() => { setDenyData(fullReq); setAdminRemarks(""); }}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    title="Deny"
                    >
                    <X size={18} />
                    </button>
                </div>
            );
            }}
        />
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={requests.length}
        onItemsPerPageChange={setItemsPerPage}
      />

      {viewData && (
        <Modal title={`Details: ${viewData.itemType}`} onClose={() => setViewData(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <Field label="ID" value={viewData._id || viewData.id} />
                <Field label="Requested By" value={viewData.requestedBy} />
                <div className="col-span-2">
                    <Field label="Date Requested" value={new Date(viewData.requestDate).toLocaleString()} />
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                    <Field label="Reason for Request" value={viewData.reason || "No reason provided."} />
                </div>
            </div>
            <div className="flex justify-end">
               <button onClick={() => setViewData(null)} className="px-4 py-2 bg-slate-200 rounded-lg">Close</button>
            </div>
           </div>
        </Modal>
      )}

      {approveData && (
        <Modal title="Confirm Delete" onClose={() => setApproveData(null)}>
           <p className="text-sm text-slate-600 mb-4 bg-red-50 p-3 rounded border border-red-100">
             Permanently delete <strong>{approveData.itemDescription}</strong>?
           </p>

           <div className="mb-4 bg-amber-50 p-3 rounded border border-amber-100">
              <div className="flex items-center gap-2 text-amber-800 mb-1">
                <MessageSquare size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">Requester's Reason</span>
              </div>
              <p className="text-sm text-amber-900 pl-1">
                {approveData.reason || "No reason provided."}
              </p>
           </div>

           <Textarea
             label="Admin Remarks (Required)"
             value={adminRemarks}
             onChange={(e) => setAdminRemarks(e.target.value)}
             placeholder="Enter remarks to proceed..."
           />
           <div className="mt-4 flex justify-end gap-3">
             <button onClick={() => setApproveData(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleApprove} disabled={!adminRemarks} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">Approve & Delete</button>
           </div>
        </Modal>
      )}

      {denyData && (
        <Modal title="Deny Request" onClose={() => setDenyData(null)}>
           <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
             Deny deletion of <strong>{denyData.itemDescription}</strong>? <br/>
             <span className="text-xs text-slate-500">The item will remain in the database.</span>
           </p>
           <div className="mb-4 p-3 rounded bg-slate-50 border border-slate-100 text-xs text-slate-500">
              <strong>Requester's Reason:</strong> {denyData.reason || "N/A"}
           </div>

           <Textarea
             label="Reason for Denial (Required)"
             value={adminRemarks}
             onChange={(e) => setAdminRemarks(e.target.value)}
             placeholder="Why are you denying this request?"
           />
           <div className="mt-4 flex justify-end gap-3">
             <button onClick={() => setDenyData(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleDeny} disabled={!adminRemarks} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Deny Request</button>
           </div>
        </Modal>
      )}

    </Layout>
  );
};

export default DeletionRequests;