import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import Textarea from "../components/common/Textarea";
import { Check, X, Eye } from "lucide-react"; 

const REQUEST_STORAGE_KEY = "ibt_deletion_requests";
const LOG_STORAGE_KEY = "ibt_deletion_log";

const DeletionRequests = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [viewRow, setViewRow] = useState(null);
  const [approveRow, setApproveRow] = useState(null);
  const [denyRow, setDenyRow] = useState(null); 
  const [adminRemarks, setAdminRemarks] = useState("");

  useEffect(() => {
    try {
      const rawReqs = localStorage.getItem(REQUEST_STORAGE_KEY);
      setAllRequests(rawReqs ? JSON.parse(rawReqs) : []);
      
      const rawLogs = localStorage.getItem(LOG_STORAGE_KEY);
      setAllLogs(rawLogs ? JSON.parse(rawLogs) : []);
    } catch (e) {
      console.error("Failed to load deletion requests", e);
    }
  }, []);

  const pendingRequests = useMemo(() => {
    return allRequests.filter(req => req.status === "pending");
  }, [allRequests]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pendingRequests.slice(startIndex, endIndex);
  }, [pendingRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);

  const handleApprove = () => {
    if (!approveRow || !adminRemarks) {
      console.error("Remarks are required to approve."); 
      return;
    }

    try {
      const logEntry = {
        ...approveRow,
        status: "Approved",
        adminRemarks: adminRemarks,
        processedDate: new Date().toISOString()
      };
      const nextLogs = [...allLogs, logEntry];

      const nextRequests = allRequests.filter(req => req.id !== approveRow.id);

      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      
      setAllRequests(nextRequests);
      setAllLogs(nextLogs);
      
      setApproveRow(null);
      setAdminRemarks("");
    } catch (e) {
      console.error("Failed to approve request", e);
    }
  };

  const handleDeny = () => {
    if (!denyRow || !adminRemarks) {
      console.error("Remarks are required to deny.");
      return;
    }

    try {
      const itemType = denyRow.itemType;
      const originalData = denyRow.originalData;
      let storageKey = "";

      if (itemType === "Bus Trip") storageKey = "ibt_busTrips";
      else if (itemType === "Parking Ticket") storageKey = "ibt_parking";
      else if (itemType === "Report") storageKey = "ibt_reports";
      else if (itemType === "Tenant") storageKey = "ibt_TenantLease";
      else if (itemType === "Lost & Found") storageKey = "ibt_lostFound";
      else if (itemType === "Terminal Fee") storageKey = "ibt_terminalFees";

      if (storageKey) {
        const raw = localStorage.getItem(storageKey);
        const activeList = raw ? JSON.parse(raw) : [];
        activeList.push(originalData);
        localStorage.setItem(storageKey, JSON.stringify(activeList));
      } else {
        console.warn(`No active list key found for item type: ${itemType}`);
      }

      const logEntry = {
        ...denyRow,
        status: "Denied",
        adminRemarks: adminRemarks,
        processedDate: new Date().toISOString()
      };
      const nextLogs = [...allLogs, logEntry];
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));

      const nextRequests = allRequests.filter(req => req.id !== denyRow.id);
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
      
      setAllRequests(nextRequests);
      setAllLogs(nextLogs);
      setDenyRow(null);
      setAdminRemarks("");

    } catch (e) {
      console.error("Failed to deny request", e);
    }
  };

  return (
    <Layout title="Deletion Requests">
      <p className="mb-4 text-sm text-slate-600">
        Review and approve deletion requests submitted by staff. Approved items are permanently deleted. Denied items are restored.
      </p>

      <Table
        columns={["Item Type", "Description", "Requested By", "Date Requested"]}
        data={paginatedData.map((req) => ({
          ...req,
          dateRequested: new Date(req.requestDate).toLocaleString(),
        }))}
        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <button
              onClick={() => setViewRow(row)}
              title="View Details"
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => { setApproveRow(row); setAdminRemarks(""); }}
              title="Approve Deletion"
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all"
            >
              <Check size={16} />
            </button>

            <button
              onClick={() => { setDenyRow(row); setAdminRemarks(""); }}
              title="Deny Request"
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <X size={16} />
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
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Request: {viewRow.itemType}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Request ID" value={viewRow.id} />
              <Field label="Item Type" value={viewRow.itemType} />
              <Field label="Description" value={viewRow.itemDescription} />
              <Field label="Requested By" value={viewRow.requestedBy} />
              <Field label="Date Requested" value={new Date(viewRow.requestDate).toLocaleString()} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <h4 className="mt-4 mb-2 text-sm font-semibold text-slate-600">Original Data</h4>
            <pre className="bg-slate-50 p-3 rounded-lg text-xs overflow-auto">
              {JSON.stringify(viewRow.originalData, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
      
      {approveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Approve Deletion</h3>
            <p className="text-sm text-slate-600 mb-2">
              You are about to approve the permanent deletion of:
            </p>
            <div className="mb-4">
              <Field label={approveRow.itemType} value={approveRow.itemDescription} />
            </div>
            <Textarea
              label="Admin Remarks (Required)"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setApproveRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button 
                onClick={handleApprove} 
                disabled={!adminRemarks}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white shadow hover:bg-green-700 disabled:bg-slate-300"
              >
                Confirm & Approve Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {denyRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Deny Deletion Request</h3>
            <p className="text-sm text-slate-600 mb-2">
              You are about to deny the deletion request for:
            </p>
            <div className="mb-4">
              <Field label={denyRow.itemType} value={denyRow.itemDescription} />
            </div>
            <Textarea
              label="Admin Remarks (Required)"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDenyRow(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button 
                onClick={handleDeny} 
                disabled={!adminRemarks}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow hover:bg-red-700 disabled:bg-slate-300"
              >
                Confirm & Deny Request
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default DeletionRequests;