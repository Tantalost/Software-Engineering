import React from "react";
import StatusBadge from "./StatusBadge";
import TableActions from "./TableActions";

const Table = ({ columns = [], data = [], actions }) => {
  const keyFromCol = (col) => col.toLowerCase().replace(/\s+/g, "");

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 whitespace-nowrap">{col}</th>
              ))}
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                  {columns.map((col, i) => {
                    const key = keyFromCol(col);
                    const value = row[key];

                    if (col.toLowerCase().includes("status")) {
                      return (
                        <td key={i} className="px-6 py-3">
                          <StatusBadge status={value} />
                        </td>
                      );
                    }

                    return <td key={i} className="px-6 py-3">{value ?? "-"}</td>;
                  })}

                  <td className="px-6 py-3 text-right">
                    {actions ? (
                      actions(row)
                    ) : (
                      <TableActions
                        onView={() => alert(`View ${JSON.stringify(row)}`)}
                        onEdit={() => alert(`Edit ${JSON.stringify(row)}`)}
                        onDelete={() => alert(`Delete ${JSON.stringify(row)}`)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
