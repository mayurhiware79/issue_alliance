import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Reusable BarChart component
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of objects with data
 * @param {string} props.dataKey - The key to use for values (default: 'count')
 * @param {string} props.nameKey - The key to use for labels (default: 'name')
 * @param {string} props.title - Chart title
 * @param {string} props.color - Bar color (default: '#8884d8')
 */
export default function BarChart({ data, dataKey = 'count', nameKey = 'name', title, color = '#8884d8' }) {
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
          <RechartsBarChart
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
              dataKey={nameKey} 
              tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
              height={60}
              interval={0}
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
              contentStyle={{ backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                           color: darkMode ? '#eee' : '#333',
                           borderRadius: '6px',
                           borderColor: darkMode ? '#666' : '#ccc' }}
            />
            <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
            <Bar dataKey={dataKey} fill={color} name="Count" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 