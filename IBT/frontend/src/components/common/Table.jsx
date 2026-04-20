import React from "react";
import StatusBadge from "./StatusBadge";
import TableActions from "./TableActions";

const Table = ({ columns = [], data = [], actions, variant = "default" }) => {
  const isTerminal = variant === "terminal";
  const keyFromCol = (col) => {
    if (typeof col === 'string') {
      return col.toLowerCase().replace(/\s+/g, '-');
    }
    if (React.isValidElement(col)) {
      return col.key || 'select';
    }
    return 'col-' + Math.random().toString(36).substr(2, 9);
  };

  const thBase = isTerminal
    ? "px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
    : "px-6 py-4 whitespace-nowrap";
  const theadClass = isTerminal
    ? "bg-slate-50 border-b border-slate-200"
    : "bg-gray-100 text-gray-800 uppercase text-xs font-bold tracking-wider border-b-2 border-gray-200";
  const actionsThBg = isTerminal ? "bg-slate-50" : "bg-gray-100";
  const tdBase = isTerminal
    ? "px-4 py-4 text-sm text-slate-600 whitespace-nowrap"
    : "px-6 py-4 whitespace-nowrap";

  const tableInner = (
        <table
          className={
            isTerminal
              ? "w-full text-left whitespace-nowrap"
              : "min-w-full text-sm text-left text-gray-600"
          }
        >
          <thead className={theadClass}>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={thBase}>
                  {col}
                </th>
              ))}
              <th
                className={`${thBase} text-right sticky right-0 z-10 md:static ${actionsThBg} ${isTerminal ? "border-b border-slate-200" : "border-b-2 border-gray-200"}`}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody
            className={isTerminal ? "divide-y divide-slate-100" : "divide-y divide-gray-100"}
          >
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className={`text-center py-8 ${isTerminal ? "text-slate-400" : "text-gray-400"}`}
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const isHighlighted = row?.__highlight === true;
                const highlightVariant = row?.__highlightVariant === "amber" ? "amber" : "emerald";
                const rowBg = isHighlighted
                  ? highlightVariant === "amber"
                    ? "bg-amber-50"
                    : "bg-emerald-50"
                  : isEven
                    ? "bg-white"
                    : isTerminal
                      ? "bg-slate-50/50"
                      : "bg-gray-50";
                const hoverBg = isHighlighted
                  ? highlightVariant === "amber"
                    ? "hover:bg-amber-100"
                    : "hover:bg-emerald-100"
                  : isTerminal
                    ? "hover:bg-slate-50"
                    : "hover:bg-blue-50";

                return (
                  <tr
                    key={idx}
                    className={`${rowBg} ${hoverBg} transition-colors duration-150 ${row?.__rowClassName || ""}`}
                  >
                    {columns.map((col, i) => {
                      const key = keyFromCol(col);
                      let value = row[key];
                      if (value === undefined && i === 0) value = row.select;
                      if (value === undefined) value = row[key.replace(/-/g, '')];
                      const colName = typeof col === 'string' ? col : "";

                      if (colName.toLowerCase().includes("status")) {
                        return (
                          <td key={i} className={tdBase}>
                            <StatusBadge status={value} />
                          </td>
                        );
                      }

                     const isMono = ["ticket", "price"].some((k) =>
                        colName.toLowerCase().includes(k)
                      ) || key === "rent" || key === "util" || key === "total-due" || key === "advance-bal" || key === "fee/hr" || key === "total";

                      return (
                        <td
                          key={i}
                          className={`${tdBase} ${
                            isMono
                              ? isTerminal
                                ? "font-mono font-medium text-slate-800"
                                : "font-mono font-medium text-gray-900"
                              : ""
                          }`}
                        >
                          {value ?? "-"}
                        </td>
                      );
                    })}
                    <td
                      className={`${tdBase} text-right sticky right-0 md:static shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] md:shadow-none ${rowBg}`}
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
  );

  if (isTerminal) {
    return <div className="overflow-x-auto">{tableInner}</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">{tableInner}</div>
    </div>
  );
};

export default Table;