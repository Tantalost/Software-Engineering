import React from "react";
import { Eye, Edit, } from "lucide-react";

const TableActions = ({ onView, onEdit, onDelete }) => {
  return (
    <div className="flex justify-end space-x-2">
      <button
        onClick={onView}
        title="View"
        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={onEdit}
        title="Edit"
        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
      >
        <Edit size={16} />
      </button>
    </div>
  );
};

export default TableActions;
