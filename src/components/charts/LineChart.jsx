import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Reusable LineChart component
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of objects with data
 * @param {string} props.xDataKey - The key to use for X-axis (default: 'date')
 * @param {string} props.yDataKey - The key to use for Y-axis (default: 'count')
 * @param {string} props.title - Chart title
 * @param {string} props.color - Line color (default: '#8884d8')
 */
export default function LineChart({ data, xDataKey = 'date', yDataKey = 'count', title, color = '#8884d8' }) {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  
  // If no data, show empty state
  if (!data || !data.length) {
    return (
      <div className={`h-64 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow p-4 h-full`}>
      {title && <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-700'} mb-4`}>{title}</h3>}
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ddd'} />
            <XAxis 
              dataKey={xDataKey} 
              tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
              height={60}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              stroke={darkMode ? '#777' : '#ccc'}
            />
            <YAxis 
              tick={{ fill: darkMode ? '#eee' : '#333' }}
              stroke={darkMode ? '#777' : '#ccc'} 
            />
            <Tooltip 
              formatter={(value) => [`${value}`, 'Count']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ 
                backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                color: darkMode ? '#eee' : '#333',
                borderRadius: '6px',
                borderColor: darkMode ? '#666' : '#ccc' 
              }}
            />
            <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
            <Line 
              type="monotone" 
              dataKey={yDataKey} 
              stroke={color} 
              activeDot={{ r: 8 }}
              name="Interactions" 
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 