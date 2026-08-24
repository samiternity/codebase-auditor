import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: '#fff',
        maxWidth: '250px',
        wordWrap: 'break-word'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.name}</p>
        <p style={{ margin: '5px 0 0', color: '#F87171' }}>
          Violations: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const TopViolationsChart = ({ isOnboarded = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/analytics/top-violations`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch top violations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchViolations();
  }, []);

  if (!isOnboarded) {
    return (
      <div style={{ height: 300, display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="adr" 
            type="category" 
            stroke="#64748B" 
            tick={{ fill: '#94A3B8', fontSize: 11 }} 
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#F87171' : '#64748B'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TopViolationsChart);
