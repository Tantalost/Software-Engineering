import Field from "./Field";

const ViewModal = ({ row, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">View Lost/Found</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
          <Field label="Tracking No" value={row.trackingno} />
          <Field label="Status" value={row.status} />
          <Field label="DateTime" value={row.datetime} />
          <div className="md:col-span-2">
            <Field label="Description" value={row.description} />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
