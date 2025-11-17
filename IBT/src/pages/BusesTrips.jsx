import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import Pagination from "../components/common/Pagination";
import TableActions from "../components/common/TableActions";
import { busSchedules } from "../data/assets";
import AddBusTripModal from "../components/busTrips/AddBusTripModal";
import ViewBusTripModal from "../components/busTrips/ViewBusTripModal";
import EditBusTripModal from "../components/busTrips/EditBusTripModal";
import DeleteModal from "../components/common/DeleteModal";
import NotifyModal from "../components/common/NotifyModal";

const BusTrips = () => {
  const role = localStorage.getItem("authRole") || "superadmin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_busTrips");
      return raw ? JSON.parse(raw) : busSchedules;
    } catch {
      return busSchedules;
    }
  };
  const [records, setRecords] = useState(loadStored());
  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_busTrips", JSON.stringify(next));
  };

  const uniqueCompanies = [...new Set(records.map((b) => b.company))];

  const filtered = records.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.templateNo.toLowerCase().includes(q) ||
      b.route.toLowerCase().includes(q);
    const matchesCompany =
      !selectedCompany || b.company === selectedCompany;
    const matchesDate =
      !selectedDate ||
      new Date(b.date).toDateString() === new Date(selectedDate).toDateString();
    return matchesSearch && matchesCompany && matchesDate;
  });

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Bus Trips Management">
      <div className="px-4 lg:px-8 mt-4 flex flex-col gap-4">
        <BusTripFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          uniqueCompanies={uniqueCompanies}
        />

        <div className="flex justify-end gap-4 w-full">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow hover:shadow-lg"
          >
            + Add New
          </button>

          {role === "superadmin" && (
            <button
              onClick={() => setShowNotify(true)}
              className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300"
            >
              Notify
            </button>
          )}

          <ExportMenu
            onExportCSV={() => console.log("Export CSV")}
            onExportExcel={() => console.log("Export Excel")}
            onExportPDF={() => console.log("Export PDF")}
            onPrint={() => window.print()}
          />
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <Table
          columns={["Template No", "Route", "Time", "Date", "Company", "Status"]}
          data={paginatedData.map((bus) => ({
            id: bus.id,
            templateno: bus.templateNo,
            route: bus.route,
            time: bus.time,
            date: bus.date,
            company: bus.company,
            status: bus.status,
          }))}
          actions={(row) => (
            <TableActions
              onView={() => setViewRow(row)}
              onEdit={() => setEditRow(row)}
              onDelete={() => setDeleteRow(row)}
            />
          )}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onItemsPerPageChange={(v) => {
            setItemsPerPage(v);
            setCurrentPage(1);
          }}
        />
      </div>

      {showAdd && (
        <AddBusTripModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            persist([{ id: Date.now(), ...data }, ...records]);
            setShowAdd(false);
          }}
        />
      )}

      {viewRow && (
        <ViewBusTripModal row={viewRow} onClose={() => setViewRow(null)} />
      )}

      {editRow && (
        <EditBusTripModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            persist(records.map((r) => (r.id === updated.id ? updated : r)));
            setEditRow(null);
          }}
        />
      )}

      {deleteRow && (
        <DeleteModal
          title="Delete Bus Trip"
          message={`Are you sure you want to delete template ${deleteRow.templateno}?`}
          onClose={() => setDeleteRow(null)}
          onConfirm={() => {
            persist(records.filter((r) => r.id !== deleteRow.id));
            setDeleteRow(null);
          }}
        />
      )}

      {showNotify && (
        <NotifyModal
          source="Bus Trips"
          onClose={() => setShowNotify(false)}
        />
      )}
    </Layout>
  );
};

export default BusTrips;