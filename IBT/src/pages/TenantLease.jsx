import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import StatCardGroup from "../components/tenants/StatCardGroup";
import { tenants } from "../data/assets";

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent");

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "permanent" ? t.type === "permanent" : t.type === "night";

    const matchesDate =
      !selectedDate ||
      new Date(t.date).toDateString() === new Date(selectedDate).toDateString();

    return matchesSearch && matchesTab && matchesDate;
  });

  const totalSlots = filtered.length;
  const availableSlots = filtered.filter((t) => t.status === "available").length;
  const nonAvailableSlots = filtered.filter((t) => t.status !== "available").length;

  return (
    <Layout title="Tenants/Lease Management">
      <StatCardGroup
        availableSlots={availableSlots}
        nonAvailableSlots={nonAvailableSlots}
        totalSlots={totalSlots}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

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

          <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
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

      <Table
        columns={["Slot No", "Reference No", "Name", "Email", "Contact", "Date", "Status",]}
        data={filtered.map((t) => ({
          slotno: t.slotNo,
          referenceno: t.referenceNo,
          name: t.name,
          email: t.email,
          contact: t.contact,
          date: t.date,
          status: t.status,
        }))}
      />
    </Layout>
  );
};

export default TenantLease;
