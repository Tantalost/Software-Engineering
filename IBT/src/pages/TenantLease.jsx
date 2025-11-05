import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import { tenants } from "../data/assets";

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("permanent");

  const filtered = tenants.filter(
    (t) =>
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeTab === "permanent" ? t.type === "permanent" : t.type === "night")
  );

  return (
    <Layout title="Tenants/Lease Management">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("permanent")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                activeTab === "permanent"
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
              }`}
            >
              Permanent
            </button>
            <button
              onClick={() => setActiveTab("night")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                activeTab === "night"
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-emerald-600 hover:text-emerald-700 hover:scale-105"
              }`}
            >
              Night Market
            </button>
          </div>
          <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center w-full sm:w-auto">
            + Add New
          </button>
          <div className="flex items-center justify-end w-full sm:w-auto transition-transform duration-300 active:scale-95 hover:scale-105">
            <ExportMenu
              onExportCSV={() => alert("Exporting to CSV...")}
              onExportExcel={() => alert("Exporting to Excel...")}
              onExportPDF={() => alert("Exporting to PDF...")}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>

      <Table columns={["Slot No", "Reference No", "Name", "Email", "Contact", "Status",]}
      data={filtered.map((t) => ({slotno: t.slotNo, referenceno: t.referenceNo, name: t.name, email: t.email, contact: t.contact, status: t.status,}))}
      />
    </Layout>
  );
};

export default TenantLease;