import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'JavaScript', count: 400 },
  { name: 'Python', count: 300 },
  { name: 'Java', count: 200 },
  { name: 'Ruby', count: 150 },
  { name: 'Go', count: 120 },
  { name: 'Rust', count: 90 },
];

export default function TestChart() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-blue-600">Test Chart Page</h1>
      <p className="mt-4">This page tests if Recharts is working properly.</p>
      
      <div className="mt-8 bg-white rounded-lg shadow p-4 h-80">
        <h2 className="text-xl font-semibold mb-4">Programming Languages</h2>
        
        <ResponsiveContainer width="100%" height="80%">
          <BarChart
            data={data}
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
  );
} 