import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/FilterBar";
import Table from "../components/common/Table";
import { tenants } from "../data/TenantsData";

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Tenants/Lease Management">
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => alert("Filter clicked")} />
      <Table
        columns={["Slot No", "Reference No", "Name", "Email", "Contact", "Status"]}
        data={filtered.map((t) => ({
          slotno: t.slotNo,
          referenceno: t.referenceNo,
          name: t.name,
          email: t.email,
          contact: t.contact,
          status: t.status,
        }))}
      />
    </Layout>
  );
};

export default TenantLease;
