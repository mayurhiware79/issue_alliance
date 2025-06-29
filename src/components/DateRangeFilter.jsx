import { useState } from 'react';

/**
 * DateRangeFilter component
 * @param {Object} props - Component props
 * @param {Function} props.onFilterChange - Callback when filters change
 */
export default function DateRangeFilter({ onFilterChange }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ startDate, endDate });
  };
  
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onFilterChange({ startDate: '', endDate: '' });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Date Range Filter</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-sm text-gray-600 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-sm text-gray-600 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Filter
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
} 