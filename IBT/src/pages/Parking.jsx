import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import Table from "../components/common/Table";
import { parkingTickets } from "../data/assets";

const Parking = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = parkingTickets.filter((ticket) =>
    ticket.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Parking Management">
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => alert("Filter clicked")} />
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
