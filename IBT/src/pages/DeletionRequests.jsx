import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import Textarea from "../components/common/Textarea";
import { Check, X, Eye, AlertCircle, MessageSquare } from "lucide-react"; 

const REQUEST_STORAGE_KEY = "ibt_deletion_requests";
const LOG_STORAGE_KEY = "ibt_deletion_log";

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
  const [allRequests, setAllRequests] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [viewData, setViewData] = useState(null); 
  const [approveData, setApproveData] = useState(null);
  const [denyData, setDenyData] = useState(null); 
  const [adminRemarks, setAdminRemarks] = useState("");

  useEffect(() => {
    const loadData = () => {
      try {
        const rawReqs = localStorage.getItem(REQUEST_STORAGE_KEY);
        const rawLogs = localStorage.getItem(LOG_STORAGE_KEY);
        setAllRequests(rawReqs ? JSON.parse(rawReqs) : []);
        setAllLogs(rawLogs ? JSON.parse(rawLogs) : []);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const pendingRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter(req => 
      req.status && req.status.toLowerCase() === "pending"
    );
  }, [allRequests]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pendingRequests.slice(startIndex, endIndex);
  }, [pendingRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);

  const getFullRequest = (id) => allRequests.find(r => r.id === id);

  const handleApprove = () => {
    if (!approveData || !adminRemarks) return;

    try {
      const logEntry = {
        ...approveData,
        status: "Approved (Deleted)",
        adminRemarks: adminRemarks,
        processedDate: new Date().toISOString()
      };
      
      const nextLogs = [logEntry, ...allLogs];
      const nextRequests = allRequests.filter(req => req.id !== approveData.id);

      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      
      setAllRequests(nextRequests);
      setAllLogs(nextLogs);
      setApproveData(null);
      setAdminRemarks("");
    } catch (e) {
      console.error("Approve Error", e);
    }
  };

  const handleDeny = () => {
    if (!denyData || !adminRemarks) return;

    try {
      const { itemType, originalData } = denyData;
      let storageKey = "";

      switch(itemType) {
        case "Bus Trip": storageKey = "ibt_busTrips"; break;
        case "Parking Ticket": storageKey = "ibt_parking"; break;
        case "Report": storageKey = "ibt_reports"; break;
        case "Tenant": storageKey = "ibt_TenantLease"; break;
        case "Lost & Found": storageKey = "ibt_lostFound"; break;
        case "Terminal Fee": storageKey = "ibt_terminalFees"; break;
        default: console.warn("Unknown Item Type", itemType);
      }

      if (storageKey && originalData) {
        const raw = localStorage.getItem(storageKey);
        const activeList = raw ? JSON.parse(raw) : [];
        if (!activeList.some(item => item.id === originalData.id)) {
          activeList.push(originalData);
          localStorage.setItem(storageKey, JSON.stringify(activeList));
        }
      }

      const logEntry = {
        ...denyData,
        status: "Denied (Restored)",
        adminRemarks: adminRemarks,
        processedDate: new Date().toISOString()
      };

      const nextLogs = [logEntry, ...allLogs];
      const nextRequests = allRequests.filter(req => req.id !== denyData.id);

      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));


      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
      
      setAllRequests(nextRequests);
      setAllLogs(nextLogs);
      setDenyData(null);
      setAdminRemarks("");

    } catch (e) {
      console.error("Deny Error", e);
    }
  };

  return (
    <Layout title="Deletion Requests">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r flex items-start gap-3">
        <AlertCircle className="text-amber-600 mt-0.5" size={20} />
        <div>
          <p className="font-semibold text-amber-800">Admin Approval Required</p>
          <p className="text-sm text-amber-700">Review pending deletion requests.</p>
        </div>
      </div>

      <Table
        columns={["Item Type", "Description", "Requested By", "Reason", "Date"]}
        data={paginatedData.map((req) => ({
          itemtype: req.itemType,           
          description: req.itemDescription, 
          requestedby: req.requestedBy,
          reason: req.reason || "N/A",     
          date: new Date(req.requestDate).toLocaleString(), 
          id: req.id 
        }))}
        emptyMessage="No pending deletion requests."
        actions={(row) => (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setViewData(getFullRequest(row.id))}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              title="View Details"

            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => { setApproveData(getFullRequest(row.id)); setAdminRemarks(""); }}
              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
              title="Approve"
            >
              <Check size={18} />
            </button>

            <button
              onClick={() => { setDenyData(getFullRequest(row.id)); setAdminRemarks(""); }}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              title="Deny"
            >
              <X size={18} />
            </button>
          </div>
        )}
      />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={pendingRequests.length}
        onItemsPerPageChange={setItemsPerPage}
      />

      {viewData && (
        <Modal title={`Details: ${viewData.itemType}`} onClose={() => setViewData(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
   
        <Field label="ID" value={viewData.id} />
        <Field label="Requested By" value={viewData.requestedBy} />

      <div className="col-span-2">
        <Field label="Date Requested" value={new Date(viewData.requestDate).toLocaleString()} />
      </div>

     <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
        <Field 
            label="Reason for Request" 
            value={viewData.reason || "No reason provided."} 
        />
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
             label="Admin Remarks (for Log)"
             value={adminRemarks}
             onChange={(e) => setAdminRemarks(e.target.value)}
           />
           <div className="mt-4 flex justify-end gap-3">
             <button onClick={() => setApproveData(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleApprove} disabled={!adminRemarks} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">Approve</button>
           </div>
        </Modal>
      )}

      {denyData && (
        <Modal title="Restore Data" onClose={() => setDenyData(null)}>
           <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
             Restore <strong>{denyData.itemDescription}</strong>?
           </p>
           <div className="mb-4 p-3 rounded bg-slate-50 border border-slate-100 text-xs text-slate-500">
              <strong>Requester's Reason:</strong> {denyData.reason || "N/A"}
           </div>

           <Textarea
             label="Reason for Denial"
             value={adminRemarks}
             onChange={(e) => setAdminRemarks(e.target.value)}
           />
           <div className="mt-4 flex justify-end gap-3">
             <button onClick={() => setDenyData(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleDeny} disabled={!adminRemarks} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Deny</button>
           </div>
        </Modal>
      )}

    </Layout>
  );
};

export default DeletionRequests;