import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { reports } from "../data/assets";

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = reports.filter((report) =>
     report.id.toString().includes(searchQuery) ||
     report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
     report.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Reports Management">
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
        columns={["Report ID", "Type", "Status", "Author", "Date"]}
        data={filtered.map((report) => ({
          reportid: report.id,
          type: report.type,
          status: report.status,
          author: report.author,
          date: report.date,
        }))}
      />
    </Layout>
  );
};

export default Reports;
