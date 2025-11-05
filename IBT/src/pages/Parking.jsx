import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { parkingTickets } from "../data/assets";

const Parking = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = parkingTickets.filter((ticket) =>
    ticket.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Parking Management">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="flex items-center justify-end gap-3">
          <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
            + Add New
          </button>
          <div className="h-[44px] flex items-center">
            <ExportMenu
              onExportCSV={() => alert("Exporting to CSV...")}
              onExportExcel={() => alert("Exporting to Excel...")}
              onExportPDF={() => alert("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>
      <Table
        columns={["Type", "Price", "Time", "Duration", "Status"]}
        data={filtered.map((ticket) => ({
          type: ticket.type,
          price: `₱${ticket.price.toFixed(2)}`,
          time: ticket.time,
          duration: ticket.duration,
          status: ticket.status,
        }))}
      />
    </Layout>
  );
};

export default Parking;
