import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const RadarChart = ({ data, dataKey = 'A', subjectKey = 'subject', name = 'Stats', fill = '#8884d8', stroke = '#8884d8' }) => {
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
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke={darkMode ? '#555' : '#ddd'} />
        <PolarAngleAxis 
          dataKey={subjectKey} 
          tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
          stroke={darkMode ? '#777' : '#ccc'}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: darkMode ? '#eee' : '#333' }}
          stroke={darkMode ? '#777' : '#ccc'}
        />
        <Radar
          name={name}
          dataKey={dataKey}
          stroke={stroke}
          fill={fill}
          fillOpacity={0.6}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, name]}
          contentStyle={{ 
            backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
            color: darkMode ? '#eee' : '#333',
            borderRadius: '6px',
            borderColor: darkMode ? '#666' : '#ccc' 
          }}
        />
        <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChart; 