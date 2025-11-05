import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import Table from "../components/common/Table";
import { lostFoundItems } from "../data/assets";

const LostFound = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = lostFoundItems.filter((item) =>
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Lost and Found Records">
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => alert("Filter clicked")} />
      <Table
        columns={["Tracking No", "Description", "DateTime", "Status"]}
        data={filtered.map((item) => ({
          trackingno: item.trackingNo,
          description: item.description,
          datetime: item.dateTime,
          status: item.status,
        }))}
      />
    </Layout>
  );
};

export default LostFound;
