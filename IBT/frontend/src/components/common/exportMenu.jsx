import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from "lucide-react";

const ExportMenu = ({ onExportCSV, onExportExcel, onExportPDF, onPrint }) => {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen(!open);
  const handleClose = () => setOpen(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        <Download size={18} />
        <span>Export</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={handleClose}
          ></div>

          <div
            className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 rounded-xl shadow-xl z-20"
          >
            <div className="p-1">
              <button
                onClick={() => {
                  onExportCSV && onExportCSV();
                  handleClose();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700"
              >
                <FileText size={16} className="text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  onExportExcel && onExportExcel();
                  handleClose();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => {
                  onExportPDF && onExportPDF();
                  handleClose();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700"
              >
                <FileText size={16} className="text-emerald-600" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => {
                  onPrint && onPrint();
                  handleClose();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-gray-700"
              >
                <Printer size={16} className="text-emerald-600" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
