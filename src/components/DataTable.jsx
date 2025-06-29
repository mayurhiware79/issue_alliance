import { useState } from 'react';

/**
 * DataTable component for displaying raw data
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Array of column definitions
 * @param {string} props.title - Table title
 */
export default function DataTable({ data, columns, title }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const visibleData = data?.slice(startRow, startRow + rowsPerPage) || [];
  
  // If no data, show empty state
  if (!data || !data.length) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-4">{title || 'Data Table'}</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-700 mb-4">{title || 'Data Table'}</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleData.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCellValue(item[column.key], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Format cell value based on type
 * @param {*} value - The cell value
 * @param {Function} formatFn - Optional formatting function
 * @returns {string} Formatted value
 */
function formatCellValue(value, formatFn) {
  if (formatFn) {
    return formatFn(value);
  }
  
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    // For arrays or objects, show summary
    if (Array.isArray(value)) {
      return value.length ? `[${value.length} items]` : '[]';
    }
    return Object.keys(value).length ? `{${Object.keys(value).length} props}` : '{}';
  }
  
  return String(value);
} 