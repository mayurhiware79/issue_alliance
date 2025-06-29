import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

/**
 * Reusable PieChart component
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of {name, count} objects
 * @param {string} props.dataKey - The key to use for values (default: 'count')
 * @param {string} props.nameKey - The key to use for labels (default: 'name')
 * @param {string} props.title - Chart title
 */
export default function PieChart({ data, dataKey = 'count', nameKey = 'name', title }) {
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
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              className="text-xs"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}`, 'Count']}
              contentStyle={{ 
                backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                color: darkMode ? '#eee' : '#333',
                borderRadius: '6px',
                borderColor: darkMode ? '#666' : '#ccc' 
              }}
            />
            <Legend 
              formatter={(value) => <span style={{ color: darkMode ? '#eee' : '#333' }}>{value}</span>}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 