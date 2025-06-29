import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LineChart, Line } from 'recharts';

// Static data
const skillsData = [
  { name: 'JavaScript', count: 120 },
  { name: 'Python', count: 98 },
  { name: 'Java', count: 86 },
  { name: 'C++', count: 56 },
  { name: 'React', count: 48 },
];

const contribData = [
  { name: 'Code', count: 235 },
  { name: 'Issues', count: 187 },
  { name: 'PR Review', count: 132 },
  { name: 'Documentation', count: 78 },
  { name: 'Testing', count: 56 },
];

const timeData = [
  { date: '2023-01', count: 45 },
  { date: '2023-02', count: 58 },
  { date: '2023-03', count: 73 },
  { date: '2023-04', count: 89 },
  { date: '2023-05', count: 102 },
  { date: '2023-06', count: 117 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SimpleDashboard() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Simple Analytics Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold mt-1">458</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Unique Skills</p>
                <p className="text-3xl font-bold mt-1">32</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Contributions</p>
                <p className="text-3xl font-bold mt-1">687</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Chatbot Interactions</p>
                <p className="text-3xl font-bold mt-1">1,245</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-4 h-80">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Top Skills Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow p-4 h-80">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Contributions by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={contribData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow p-4 h-80 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Chatbot Interactions Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={timeData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Interactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 