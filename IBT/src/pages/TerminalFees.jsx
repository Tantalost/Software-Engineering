import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { tickets } from "../data/assets";

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filtered = tickets.filter((fee) => {
    const matchesSearch = fee.passengerType
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate
      ? new Date(fee.date).toDateString() === new Date(selectedDate).toDateString()
      : true;
    return matchesSearch && matchesDate;
  });

  return (
    <Layout title="Terminal Fees Management">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <div className="flex justify-end sm:justify-end w-full sm:w-auto gap-5">
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
        data={filtered.map((fee) => ({
          ticketno: fee.ticketNo,
          passengertype: fee.passengerType,
          time: fee.time,
          date: fee.date,
          price: `₱${fee.price.toFixed(2)}`,
        }))}
      />
    </Layout>
  );
};

export default TerminalFees;
