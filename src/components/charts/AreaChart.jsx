import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const AreaChart = ({ data, xKey = 'date', yKey = 'count', fill = '#8884d8', stroke = '#8884d8', dataKey = 'count', name = 'Value' }) => {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ddd'} />
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
          tickFormatter={(value) => {
            if (xKey === 'date') {
              return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return value;
          }}
          stroke={darkMode ? '#777' : '#ccc'}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
          stroke={darkMode ? '#777' : '#ccc'} 
        />
        <Tooltip 
          formatter={(value) => [value, name]}
          labelFormatter={(label) => {
            if (xKey === 'date') {
              return new Date(label).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            }
            return label;
          }}
          contentStyle={{ 
            backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
            color: darkMode ? '#eee' : '#333',
            borderRadius: '6px',
            borderColor: darkMode ? '#666' : '#ccc' 
          }}
        />
        <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          name={name}
          stroke={stroke} 
          fill={fill} 
          fillOpacity={0.3}
          activeDot={{ r: 8 }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart; 