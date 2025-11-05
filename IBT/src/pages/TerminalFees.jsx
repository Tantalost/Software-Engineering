import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { tickets } from "../data/assets";

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = tickets.filter((fee) =>
    fee.passengerType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Terminal Fees Management">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <ExportMenu
          onExportCSV={() => alert("Exporting to CSV...")}
          onExportExcel={() => alert("Exporting to Excel...")}
          onExportPDF={() => alert("Exporting to PDF...")}
          onPrint={() => window.print()}
        />
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
