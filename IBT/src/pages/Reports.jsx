import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import Table from "../components/common/Table";
import { reports } from "../data/assets";

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = reports.filter((report) =>
     report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Reports Management">
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => alert("Filter clicked")} />
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
