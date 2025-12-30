import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ChartDataPoint } from '../types';

interface StockChartProps {
  data: ChartDataPoint[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 0,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#304a4d" vertical={false} opacity={0.5} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          tick={{fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace'}}
          tickMargin={10}
          minTickGap={40}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          stroke="#94a3b8"
          tick={{fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace'}}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e3336', 
            borderColor: '#304a4d', 
            color: '#fff',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '12px'
          }}
          itemStyle={{ color: '#ef4444' }}
          formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, "Value"]}
          labelStyle={{ color: '#cbd5e1', marginBottom: '4px' }}
          cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#ef4444" 
          strokeWidth={2}
          fill="url(#gradient-area)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default StockChart;