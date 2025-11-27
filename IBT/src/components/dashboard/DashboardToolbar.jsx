import React, { useState, useMemo } from 'react';
import { RefreshCw, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DashboardToolbar = ({ onFilterChange, onRefresh, onDownload }) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('week'); 

  const navigate = (direction) => {
    const newDate = new Date(date);
    if (view === 'week') {
      newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'year') {
      newDate.setFullYear(date.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setDate(newDate);
    
    if(onFilterChange) onFilterChange({ date: newDate, view });
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const jumpToToday = () => {
    const today = new Date();
    setDate(today);
    if(onFilterChange) onFilterChange({ date: today, view });
  };

  const dateLabel = useMemo(() => {
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    
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
      
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${sameYear ? `, ${end.getFullYear()}` : ''}`;
    }
  }, [date, view]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
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
        <div className="flex items-center justify-center min-w-[160px] px-2 gap-2">
            <Calendar size={14} className="text-gray-400 mb-0.5" />
            <span className="text-sm font-semibold text-gray-700 select-none">
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
        <button 
            onClick={jumpToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-gray-50/50 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors mr-1">
          Today
        </button>
        <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>
        <button 
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all border border-transparent hover:border-green-100" 
            title="Refresh Data">
          <RefreshCw size={18} />
        </button>
        <button 
            onClick={onDownload}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100" 
            title="Download Report">
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default DashboardToolbar;