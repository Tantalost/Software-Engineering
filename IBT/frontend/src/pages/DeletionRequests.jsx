import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import Textarea from "../components/common/Textarea";
import {
  Check,
  X,
  Eye,
  AlertCircle,
  MessageSquare,
  Loader2,
  ListChecks,
  Trash2,
  Archive,
  History,
  ChevronDown,
} from "lucide-react";
import { logActivity } from "../utils/logger";
import LogModal from "../components/common/LogModal";
import NotificationToast from "../components/common/NotificationToast";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;
const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose}>
          <X
            size={20}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          />
        </button>
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

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

  const normalizeStatus = (status) => {
    if (typeof status === "string") {
      const normalized = status.trim().toLowerCase();
      if (["approved", "approve"].includes(normalized)) return "approved";
      if (["denied", "deny", "disapproved", "disapprove", "rejected", "reject"].includes(normalized)) {
        return "denied";
      }
      return "pending";
    }

    if (status && typeof status === "object") {
      return normalizeStatus(
        status.name ||
          status.value ||
          status.status ||
          status.action ||
          status.label ||
          status.state,
      );
    }

    return "pending";
  };

  const filteredRequests = useMemo(() => {
    if (statusFilter === "All") return requests;
    return requests.filter((req) => normalizeStatus(req.status) === statusFilter.toLowerCase());
  }, [requests, statusFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const selectableRequests = paginatedData; 

  const toggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = selectableRequests.map((item) => item._id || item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      const pageIds = selectableRequests.map((item) => item._id || item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const isAllSelected =
    selectableRequests.length > 0 &&
    selectableRequests.every((item) => selectedIds.includes(item._id || item.id));

  const getStatusLabel = (status) => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === "approved") return "Approved";
    if (normalizedStatus === "denied") return "Denied";
    return "Pending";
  };

  const getDeleteEndpoint = (itemType, originalId) => {
    if (itemType === "Terminal Fee") {
      return `${API_URL}/terminal-fees/${originalId}`;
    }

    if (itemType === "Bus Trip") {
      return `${API_URL}/bustrips/${originalId}`;
    }

    if (itemType === "Lost & Found Item") {
      return `${API_URL}/lostfound/${originalId}`;
    }

    return "";
  };

  // BULK DELETE REQUEST LOGS
  const handleConfirmBulkDelete = async () => {
    setIsLoading(true);
    try {
      const processPromises = selectedIds.map(async (id) => {
        await fetch(`${API_URL}/deletion-requests/${id}`, { method: "DELETE" });
      });

      await Promise.all(processPromises);
      
      await logActivity(
        role,
        "BULK_DELETE_REQUESTS",
        `Bulk deleted ${selectedIds.length} deletion request logs`,
        "DeletionRequests",
      );

      showToast(
        "success",
        `Successfully deleted ${selectedIds.length} request logs.`,
      );

      setSelectedIds([]);
      setIsSelectionMode(false);
      setShowBulkDeleteModal(false);
      fetchRequests();
    } catch (e) {
      console.error("Bulk delete failed", e);
      showToast("error", "Failed to delete some records.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveData || !adminRemarks) return;

    try {
      if (approveData.originalData) {
        await fetch(ARCHIVE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: approveData.itemType,
            description: approveData.itemDescription,
            originalData: approveData.originalData,
            archivedBy: role,
          }),
        });

        // 2. DELETE FROM ORIGINAL TABLE
        const originalId = approveData.originalData._id || approveData.originalData.id;
        const deleteEndpoint = getDeleteEndpoint(approveData.itemType, originalId);

        if (deleteEndpoint) {
          await fetch(deleteEndpoint, { method: "DELETE" });
        }
      }

      // 3. Mark the request as Approved in the DeletionRequests collection
      const res = await fetch(
        `${API_URL}/deletion-requests/${approveData._id || approveData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            adminRemarks,
          }),
        },
      );

      if (!res.ok) throw new Error("Approval failed");

      await logActivity(
        role,
        "APPROVE_DELETE",
        `Approved deletion of ${approveData.itemDescription}`,
        "DeletionRequests",
      );

      setApproveData(null);
      setAdminRemarks("");
      fetchRequests();
      showToast("success", "Item deleted and archived successfully.");
    } catch (e) {
      console.error("Approve Error", e);
      showToast("error", "Failed to approve request.");
    }
  };

  const handleDeny = async () => {
    if (!denyData || !adminRemarks) return;

    try {
      const res = await fetch(
        `${API_URL}/deletion-requests/${denyData._id || denyData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deny",
            adminRemarks,
          }),
        },
      );

      if (!res.ok) throw new Error("Denial failed");

      await logActivity(
        role,
        "DENY_DELETE",
        `Denied deletion of ${denyData.itemDescription}`,
        "DeletionRequests",
      );

      setDenyData(null);
      setAdminRemarks("");
      fetchRequests();

      showToast("success", "Deletion request denied.");
    } catch (e) {
      console.error("Deny Error", e);
      showToast("error", "Failed to deny request.");
    }
  };

  const columns = isSelectionMode
    ? [
        <div key="header-check" className="flex items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>,
        "Item Type",
        "Description",
        "Requested By",
        "Reason",
        "Status",
        "Date",
      ]
    : ["Item Type", "Description", "Requested By", "Reason", "Status", "Date"];

  return (
    <Layout title="Deletion Requests">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r flex items-start gap-3">
        <AlertCircle
          className="text-amber-600 mt-0.5 flex-shrink-0"
          size={20}
        />
        <div>
          <p className="font-semibold text-amber-800">
            Admin Approval Required
          </p>
          <p className="text-sm text-amber-700">
            Review pending deletion requests from Admins.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">STATUS:</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-2 pl-3 pr-10 outline-none font-semibold shadow-sm appearance-none cursor-pointer"
            >
              <option value="All">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          {isSelectionMode && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                title="Delete Selected Logs"
                className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[40px] rounded-xl shadow-sm hover:border-emerald-500 transition-all cursor-pointer"
          >
            <History size={18} />
            <span className="hidden sm:inline">Logs</span>
          </button>
          <button
            onClick={toggleSelectionMode}
            title={isSelectionMode ? "Cancel Selection" : "Select Records"}
            className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
              isSelectionMode
                ? "bg-red-500 text-white shadow-md cursor-pointer hover:bg-red-600 border-red-600"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer"
            }`}
          >
            {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={paginatedData.map((req) => {
            const baseData = {
              itemtype: req.itemType,
              description: req.itemDescription,
              requestedby: req.requestedBy,
              reason: req.reason || "N/A",
              status: getStatusLabel(req.status),
              date: new Date(req.requestDate).toLocaleString(),
              id: req._id || req.id,
            };
            if (isSelectionMode) {
              return {
                select: (
                  <div
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(req._id || req.id)}
                      onChange={() => toggleSelect(req._id || req.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                ),
                ...baseData,
              };
            }

            return baseData;
          })}
          emptyMessage="No deletion requests found."
          actions={(row) => {
            const fullReq = requests.find(
              (r) => r._id === row.id || r.id === row.id,
            );
            const isPending = normalizeStatus(fullReq?.status) === "pending";
            return (
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setViewData(fullReq)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
                {isPending ? (
                  <>
                    <button
                      onClick={() => {
                        setApproveData(fullReq);
                        setAdminRemarks("");
                      }}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 cursor-pointer"
                      title="Approve"
                    >
                      <Check size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setDenyData(fullReq);
                        setAdminRemarks("");
                      }}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer"
                      title="Deny"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : null}
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
        totalItems={filteredRequests.length}
        onItemsPerPageChange={setItemsPerPage}
      />

      {viewData && (
        <Modal
          title={`Details: ${viewData.itemType}`}
          onClose={() => setViewData(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
              <Field label="ID" value={viewData._id || viewData.id} />
              <Field label="Requested By" value={viewData.requestedBy} />
              <div className="col-span-2">
                <Field
                  label="Date Requested"
                  value={new Date(viewData.requestDate).toLocaleString()}
                />
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                <Field
                  label="Reason for Request"
                  value={viewData.reason || "No reason provided."}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewData(null)}
                className="px-4 py-2 bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
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
              <span className="text-xs font-bold uppercase tracking-wide">
                Requester's Reason
              </span>
            </div>
            <p className="text-sm text-amber-900 pl-1">
              {approveData.reason || "No reason provided."}
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2 p-2 rounded bg-blue-50 text-blue-700 text-xs border border-blue-100">
            <Archive size={14} />
            <span>This item will be archived before deletion.</span>
          </div>

          <Textarea
            label="Admin Remarks (Required)"
            value={adminRemarks}
            onChange={(e) => setAdminRemarks(e.target.value)}
            placeholder="Enter remarks to proceed..."
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setApproveData(null)}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg cusor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={!adminRemarks}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Approve & Delete
            </button>
          </div>
        </Modal>
      )}

      {denyData && (
        <Modal title="Deny Request" onClose={() => setDenyData(null)}>
          <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
            Deny deletion of <strong>{denyData.itemDescription}</strong>? <br />
            <span className="text-xs text-slate-500">
              The item will remain in the database.
            </span>
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
            <button
              onClick={() => setDenyData(null)}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeny}
              disabled={!adminRemarks}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Deny Request
            </button>
          </div>
        </Modal>
      )}
      {showBulkDeleteModal && (
        <Modal title="Confirm Bulk Delete" onClose={() => setShowBulkDeleteModal(false)}>
          <p className="text-sm text-slate-600 mb-4 bg-red-50 p-3 rounded border border-red-100">
            Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> request logs?
            <br/><br/>
            This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBulkDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 cursor-pointer hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </Modal>
      )}

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      <NotificationToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </Layout>
  );
};

export default DeletionRequests;
