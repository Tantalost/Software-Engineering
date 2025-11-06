import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import StatCards from "../components/common/StatCards";
import { tickets } from "../data/assets";
import { User, GraduationCap, HeartPulse, Users } from "lucide-react";

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

  const regularCount = filtered.filter(
    (f) => f.passengerType.toLowerCase() === "regular"
  ).length;

  const studentCount = filtered.filter(
    (f) => f.passengerType.toLowerCase() === "student"
  ).length;

  const seniorCount = filtered.filter(
    (f) =>
      f.passengerType.toLowerCase() === "senior citizen" ||
      f.passengerType.toLowerCase() === "pwd"
  ).length;

  const totalPassengers = filtered.length;

  const stats = [
    {
      label: "Regular Passengers",
      value: regularCount,
      icon: <User className="text-emerald-600 w-6 h-6" />,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconBg: "bg-emerald-100",
      textColor: "text-emerald-700",
      valueColor: "text-emerald-800",
    },
    {
      label: "Students",
      value: studentCount,
      icon: <GraduationCap className="text-blue-600 w-6 h-6" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100",
      textColor: "text-blue-700",
      valueColor: "text-blue-800",
    },
    {
      label: "Senior Citizen / PWD",
      value: seniorCount,
      icon: <HeartPulse className="text-rose-600 w-6 h-6" />,
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      iconBg: "bg-rose-100",
      textColor: "text-rose-700",
      valueColor: "text-rose-800",
    },
    {
      label: "Total Passengers",
      value: totalPassengers,
      icon: <Users className="text-cyan-600 w-6 h-6" />,
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      iconBg: "bg-cyan-100",
      textColor: "text-cyan-700",
      valueColor: "text-cyan-800",
    },
  ];

  return (
    <Layout title="Terminal Fees Management">
      <StatCards stats={stats} />
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
