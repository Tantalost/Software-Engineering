import React, { useState, useMemo } from 'react';
import { RefreshCw, Download, ChevronLeft, ChevronRight, Calendar, FileText, Table } from 'lucide-react';

const DashboardToolbar = ({ onFilterChange, onRefresh, onDownload }) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('week'); 
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const navigate = (direction) => {
    const newDate = new Date(date);
    
    if (view === 'day') {
      newDate.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'year') {
      newDate.setFullYear(date.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    
    setDate(newDate);
    
    if(onFilterChange) {
      onFilterChange({ date: newDate, view });
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    if(onFilterChange) {
      onFilterChange({ date, view: newView });
    }
  };

  const dateLabel = useMemo(() => {
    if (view === 'year') return date.getFullYear().toString();
    if (view === 'month') return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (view === 'week') {
      const current = new Date(date);
      const day = current.getDay(); 
      const start = new Date(current);
      start.setDate(current.getDate() - day); 
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6); 

      const sameYear = start.getFullYear() === end.getFullYear();
      const sameMonth = start.getMonth() === end.getMonth();

      if (sameMonth && sameYear) {
         return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${sameYear ? `, ${end.getFullYear()}` : ''}`;
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [date, view]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm relative z-20">
      <div className="flex bg-gray-100/80 p-1 rounded-lg w-full sm:w-auto">
        {['week', 'month', 'year'].map((v) => (
          <button
            key={v}
            onClick={() => handleViewChange(v)}
            className={`
              flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all duration-200
              ${view === v 
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
            `}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center bg-white border border-gray-100 rounded-lg px-1 py-1 shadow-sm">
        <button 
            onClick={() => navigate('prev')}
            className="p-1.5 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center justify-center min-w-[180px] px-2 gap-2">
            <Calendar size={14} className="text-gray-400 mb-0.5" />
            <span className="text-sm font-semibold text-gray-700 select-none whitespace-nowrap">
                {dateLabel}
            </span>
        </div>

        <button 
            onClick={() => navigate('next')}
            className="p-1.5 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>
        
        <div className="relative">
          <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className={`p-2 rounded-lg transition-all border border-transparent 
                ${showDownloadMenu 
                  ? 'bg-blue-50 text-blue-600 border-blue-100' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`}
              title="Download Options">
            <Download size={18} />
          </button>

          {showDownloadMenu && (
            <>
              <div 
                className="fixed inset-0 z-30 cursor-default" 
                onClick={() => setShowDownloadMenu(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Export As</span>
                </div>
                
                <button
                  onClick={() => { onDownload('pdf'); setShowDownloadMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                >
                  <FileText size={16} className="text-red-500" />
                  <span>PDF Report</span>
                </button>

                <button
                  onClick={() => { onDownload('csv'); setShowDownloadMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors border-t border-gray-50"
                >
                  <Table size={16} className="text-emerald-500" />
                  <span>CSV Data</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardToolbar;