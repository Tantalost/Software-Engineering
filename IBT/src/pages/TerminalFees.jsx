import React, { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroupTerminal from "../components/terminal/StatCardGroupTerminal";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import ViewModal from "../components/common/ViewModal";
import EditModal from "../components/common/EditModal";
import DeleteModal from "../components/common/DeleteModal";
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";
import DatePickerInput from "../components/common/DatePickerInput";
import Pagination from "../components/common/Pagination";
import { tickets } from "../data/assets";

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = tickets.filter((fee) => {
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
    return type === "Senior Citizen" || type === "PWD";
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
          <ExportMenu
            onExportCSV={() => alert("Exporting to CSV...")}
            onExportExcel={() => alert("Exporting to Excel...")}
            onExportPDF={() => alert("Exporting to PDF...")}
            onPrint={() => window.print()}
          />
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

      {deleteRow && (
        <DeleteModal
          title="Delete Terminal Fee"
          message={`Are you sure you want to delete ticket ${deleteRow.ticketno}?`}
          onConfirm={() => {
            console.log("Deleted:", deleteRow.ticketno);
            setDeleteRow(null);
          }}
          onClose={() => setDeleteRow(null)}
        />
      )}
    </Layout>
  );
};

export default TerminalFees;
