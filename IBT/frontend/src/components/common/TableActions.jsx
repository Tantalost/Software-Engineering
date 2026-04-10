import React from "react";
import { Eye, Edit, Trash2, Flag } from "lucide-react";

const TableActions = ({ onView, onEdit, onDelete, deleteVariant = "delete" }) => {
  const DeleteIcon = deleteVariant === "request" ? Flag : Trash2;
  const deleteTitle = deleteVariant === "request" ? "Request Deletion" : "Delete";

  return (
    <div className="flex justify-end space-x-2">
      <button
        onClick={onView}
        title="View"
        className="p-1.5 cursor-pointer rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
      >
        <Eye size={16} />
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 cursor-pointer rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
        >
          <Edit size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          title={deleteTitle}
          className="p-1.5 cursor-pointer rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
        >
          <DeleteIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default TableActions;