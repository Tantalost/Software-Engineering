import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import { busSchedules } from "../data/assets";

const BusTrips = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const uniqueCompanies = [...new Set(busSchedules.map((bus) => bus.company))];

  const filtered = busSchedules.filter((bus) => {
    const matchesSearch =
      bus.templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;

    const matchesDate =
      !selectedDate ||
      new Date(bus.date).toDateString() === new Date(selectedDate).toDateString();

    return matchesSearch && matchesCompany && matchesDate;
  });

  const handleExportCSV = () => console.log("Exported Bus Trips to CSV");
  const handleExportExcel = () => console.log("Exported Bus Trips to Excel");
  const handleExportPDF = () => console.log("Exported Bus Trips to PDF");
  const handlePrint = () => window.print();

  return (
    <Layout title="Bus Trips Management">
      <div className="px-4 lg:px-8 mt-4">
        <div className="flex flex-col gap-4 w-full">
          <BusTripFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            uniqueCompanies={uniqueCompanies}

          />

          <div className="flex justify-end sm:justify-end w-full sm:w-auto gap-5">
            <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
              + Add New
            </button>
            <ExportMenu
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <Table
          columns={["Template No", "Route", "Time", "Date", "Company", "Status"]}
          data={filtered.map((bus) => ({
            templateno: bus.templateNo,
            route: bus.route,
            time: bus.time,
            date: bus.date,
            company: bus.company,
            status: bus.status,

          }))}
        />
      </div>
    </Layout>
  );
};

export default BusTrips;
