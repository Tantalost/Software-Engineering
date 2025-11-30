import React from "react";
import StatusBadge from "./StatusBadge";
import TableActions from "./TableActions";

const Table = ({ columns = [], data = [], actions }) => {
  
  // 1. Helper to safely generate a key from a column header
  const keyFromCol = (col) => {
    // If it is a string (e.g., "Ticket No"), format it to "ticket-no"
    if (typeof col === 'string') {
      return col.toLowerCase().replace(/\s+/g, '-');
    }
    // If it is a React element (the Checkbox), use its key or a default
    if (React.isValidElement(col)) {
      return col.key || 'select';
    }
    return 'col-' + Math.random().toString(36).substr(2, 9);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-bold tracking-wider border-b-2 border-gray-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
              <th className="px-6 py-4 text-right whitespace-nowrap sticky right-0 bg-gray-100 z-10 md:static border-b-2 border-gray-200">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "bg-white" : "bg-gray-50";

                return (
                  <tr
                    key={idx}
                    className={`${rowBg} hover:bg-blue-50 transition-colors duration-150`}
                  >
                    {columns.map((col, i) => {
                      const key = keyFromCol(col);
                      
                      // Data Mapping Logic:
                      // 1. Try exact key match
                      // 2. If fails, try matching "select" for the first column (checkbox)
                      // 3. If fails, try removing dashes (e.g., "ticket-no" -> "ticketno")
                      let value = row[key];
                      if (value === undefined && i === 0) value = row.select;
                      if (value === undefined) value = row[key.replace(/-/g, '')];

                      // Safe String Check: Only run string methods if col is text
                      const colName = typeof col === 'string' ? col : "";

                      if (colName.toLowerCase().includes("status")) {
                        return (
                          <td key={i} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} />
                          </td>
                        );
                      }

                      const isMono = ["ticket", "price"].some((k) =>
                        colName.toLowerCase().includes(k)
                      );

                      return (
                        <td
                          key={i}
                          className={`px-6 py-4 whitespace-nowrap ${
                            isMono ? "font-mono font-medium text-gray-900" : ""
                          }`}
                        >
                          {value ?? "-"}
                        </td>
                      );
                    })}
                    <td
                      className={`px-6 py-4 text-right whitespace-nowrap sticky right-0 md:static shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] md:shadow-none ${rowBg}`}
                    >
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;