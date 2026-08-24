import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: '#fff'
      }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>{label}</p>
        <p style={{ margin: '5px 0 0', fontWeight: 'bold', color: '#62b1ff' }}>
          Score: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const ComplianceTrendChart = ({ isOnboarded = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/analytics/compliance-trend`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, []);

  if (!isOnboarded) {
    return <div className="skeleton skeleton-chart"></div>;
  }

  if (loading) {
    return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748B" 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748B" 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#62b1ff" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#0F172A', stroke: '#62b1ff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#62b1ff', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(ComplianceTrendChart);
