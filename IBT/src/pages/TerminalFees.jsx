import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroupTerminal from "../components/terminal/StatCardGroupTerminal";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import ViewModal from "../components/common/ViewModal";
import EditModal from "../components/common/EditModal";
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";
import DatePickerInput from "../components/common/DatePickerInput";
import Pagination from "../components/common/Pagination";
import { tickets } from "../data/assets"; 
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import { Archive } from "lucide-react"; 

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);
  const role = localStorage.getItem("authRole") || "superadmin";
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadStored = () => {
    try {
      const raw = localStorage.getItem("ibt_terminalFees");
      return raw ? JSON.parse(raw) : tickets;
    } catch (e) {
      return tickets;
    }
  };

  const [records, setRecords] = useState(loadStored());

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem("ibt_terminalFees", JSON.stringify(next));
  };

  const handleArchive = (rowToArchive) => {
    try {
      const rawArchive = localStorage.getItem("ibt_archive");
      const archiveList = rawArchive ? JSON.parse(rawArchive) : [];

      const archiveItem = {
        id: `archive-${Date.now()}-${rowToArchive.id}`,
        type: "Terminal Fee",
        description: `Ticket #${rowToArchive.ticketno} - ${rowToArchive.passengertype}`, // Customized
        dateArchived: new Date().toISOString(),
        originalData: rowToArchive 
      };
      
      archiveList.push(archiveItem);
      localStorage.setItem("ibt_archive", JSON.stringify(archiveList));

    } catch (e) {
      console.error("Failed to add to archive:", e);
      return;
    }

    const nextActiveList = records.filter((r) => r.id !== rowToArchive.id);
    persist(nextActiveList);
    
    console.log("Item archived successfully!");
  };

  const filtered = records.filter((fee) => {
    const matchesSearch = fee.passengerType
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate
      ? new Date(fee.date).toDateString() ===
        new Date(selectedDate).toDateString()
      : true;
    return matchesSearch && matchesDate;
  });

  const regularCount = filtered.filter(
    (f) => (f.passengerType || "").trim().toLowerCase() === "regular"
  ).length;

  const studentCount = filtered.filter(
    (f) => (f.passengerType || "").trim().toLowerCase() === "student"
  ).length;

  const seniorCount = filtered.filter(
    (f) => {
      const type = (f.passengerType || "").trim().toLowerCase();
      return type === "senior citizen / pwd";
    }
  ).length;

  const totalPassengers = filtered.length;
  const totalRevenue = filtered.reduce((sum, f) => sum + (f.price || 0), 0);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout title="Terminal Fees Management">
      <div className="mb-6">
        <StatCardGroupTerminal
          regular={regularCount}
          student={studentCount}
          senior={seniorCount}
          totalPassengers={totalPassengers}
          totalRevenue={totalRevenue}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <div className="flex items-center justify-end gap-3">
          {role === "superadmin" && (
            <button onClick={() => setShowNotify(true)} className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all w-full sm:w-auto">
              Notify
            </button>
          )}
          <div className="flex items-center justify-end gap-3">
            <ExportMenu
              onExportCSV={() => console.log("Exporting to CSV...")} 
              onExportExcel={() => console.log("Exporting to Excel...")}
              onExportPDF={() => console.log("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <Table
        columns={["Ticket No", "Passenger Type", "Time", "Date", "Price"]}
        data={paginatedData.map((fee) => ({
          id: fee.id,
          ticketno: fee.ticketNo,
          passengertype: fee.passengerType,
          time: fee.time,
          date: fee.date,
          price: `₱${fee.price.toFixed(2)}`,
        }))}
        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <TableActions
              onView={() => setViewRow(row)}
              onEdit={() => setEditRow(row)}
            />
            <button
              onClick={() => handleArchive(row)}
              title="Archive"
              className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
            >
              <Archive size={16} />
            </button>
          </div>
        )}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filtered.length}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {viewRow && (
        <ViewModal
          title="View Terminal Fee"
          fields={[
            { label: "Ticket No", value: viewRow.ticketno },
            { label: "Passenger Type", value: viewRow.passengertype },
            { label: "Time", value: viewRow.time },
            { label: "Date", value: viewRow.date },
            { label: "Price", value: viewRow.price },
          ]}
          onClose={() => setViewRow(null)}
        />
      )}

      {editRow && (
        <EditModal
          title="Edit Terminal Fee"
          initialData={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updatedData) => {
            const next = records.map(r => r.id === updatedData.id ? updatedData : r);
            persist(next);
            setEditRow(null);
          }}
          fields={(form, set) => (
            <>
              <InputField
                label="Ticket No"
                value={form.ticketno}
                onChange={(e) => set("ticketno", e.target.value)}
              />
              <SelectField
                label="Passenger Type"
                value={form.passengertype}
                onChange={(e) => set("passengertype", e.target.value)}
                options={["Regular", "Student", "Senior Citizen / PWD"]}
              />
              <InputField
                label="Time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
              <DatePickerInput
                label="Date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              <InputField
                label="Price"
                type="number"
                value={form.price} 
                onChange={(e) => set("price", e.target.value)}
              />
            </>
          )}
        />
      )
      }

      {role === "superadmin" && showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Send Notification</h3>
            <div className="space-y-3">
              <Input label="Title" value={notifyDraft.title} onChange={(e) => setNotifyDraft({ ...notifyDraft, title: e.target.value })} />
              <Textarea label="Body" value={notifyDraft.message} onChange={(e) => setNotifyDraft({ ...notifyDraft, message: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowNotify(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
              <button onClick={() => { const raw = localStorage.getItem("ibt_notifications"); const list = raw ? JSON.parse(raw) : []; list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Terminal Fees" }); localStorage.setItem("ibt_notifications", JSON.stringify(list)); setShowNotify(false); setNotifyDraft({ title: "", message: "" }); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TerminalFees;