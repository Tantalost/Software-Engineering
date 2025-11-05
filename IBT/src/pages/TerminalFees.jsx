import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import Table from "../components/common/Table";
import { tickets } from "../data/assets";

const TerminalFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = tickets.filter((fee) =>
     fee.passengerType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Terminal Fees Management">
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => alert("Filter clicked")} />
      <Table
        columns={["Ticket No", "Passenger Type","Time", "Date", "Price"]}
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

export default TerminalFees ;
