import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BacktestResult } from '../types';

interface ComparisonViewProps {
  history: BacktestResult[];
  onBack: () => void;
}

// Fixed color palette for lines to ensure they look good on dark background
const COLORS = [
  "#20df60", // Primary Green
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

const ComparisonView: React.FC<ComparisonViewProps> = ({ history, onBack }) => {
  
  // Transform data: Merge all chartData from history into a single array aligned by date
  const processedData = useMemo(() => {
    const dateMap = new Map<string, any>();
    
    // 1. Collect all unique dates and populate values
    history.forEach((result) => {
      result.chartData.forEach((point) => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        const currentObj = dateMap.get(point.date);
        // Use result ID as key to avoid collision if same stock appears twice
        currentObj[result.id] = point.value; 
      });
    });

    // 2. Convert Map to Array and Sort by Date
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [history]);

  // Calculate Overall Date Range for Header
  const dateRangeString = useMemo(() => {
    if (processedData.length === 0) return '';
    const start = processedData[0].date;
    const end = processedData[processedData.length - 1].date;
    return `${start} ~ ${end}`;
  }, [processedData]);

  // Custom Legend Renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
        {payload.map((entry: any, index: number) => {
          // Find the original history item to get stockName
          const item = history.find(h => h.id === entry.dataKey);
          if (!item) return null;

          return (
             <div key={`legend-${index}`} className="flex items-center gap-3 bg-background-dark/60 border border-surface-border px-3 py-2 rounded-lg shadow-sm min-w-[110px]">
                {/* Color Dot */}
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: entry.color }}
                />
                {/* Text: Split into 2 lines (Symbol / Name) */}
                <div className="flex flex-col leading-none">
                   <span className="text-white font-bold text-sm mb-1">{item.symbol}</span>
                   <span className="text-gray-400 text-xs">{item.stockName}</span>
                </div>
             </div>
          );
        })}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <span className="material-symbols-outlined text-[64px] mb-4">analytics</span>
        <p className="text-xl font-medium">尚無回測紀錄</p>
        <p className="text-sm mt-2">請先進行至少一次回測以進行比較</p>
        <button 
          onClick={onBack}
          className="mt-6 px-6 py-2 bg-surface-dark border border-surface-border rounded-lg text-white hover:bg-surface-border transition-colors"
        >
          返回建立回測
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="bg-surface-dark border border-surface-border rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-white text-2xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">compare_arrows</span>
                績效比較 (Performance Comparison)
              </h3>
              <p className="text-gray-400 text-sm mt-1">比較 {history.length} 筆回測紀錄的資產淨值走勢</p>
            </div>
            {/* Optional Stats Summary could go here */}
          </div>
       </div>

       <div className="flex-1 bg-surface-dark border border-surface-border rounded-xl p-6 shadow-sm flex flex-col min-h-[550px]">
          
          {/* Time Range Display Above Chart */}
          <div className="flex justify-center mb-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background-dark border border-surface-border text-primary text-sm font-mono font-medium">
                <span className="material-symbols-outlined text-[16px]">date_range</span>
                {dateRangeString}
             </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#304a4d" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace'}}
                tickMargin={10}
                minTickGap={50}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace'}}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#142526', 
                  borderColor: '#304a4d', 
                  color: '#fff',
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#9ca3af', marginBottom: '8px', fontFamily: 'monospace' }}
                formatter={(value: number, name: string, props: any) => {
                  // Find name from history if possible, or use the name passed down
                  return [`$${Math.round(value).toLocaleString()}`, name];
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                content={renderLegend}
                wrapperStyle={{ paddingTop: '20px' }}
              />
              
              {history.map((item, index) => (
                <Line
                  key={item.id}
                  type="monotone"
                  dataKey={item.id}
                  name={item.symbol} // Only pass symbol as name for Tooltip reference
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  connectNulls // Connect lines if data has gaps (e.g. different start dates)
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
       </div>

       {/* Quick Stats Table */}
       <div className="mt-6 grid grid-cols-1 overflow-x-auto">
          <table className="w-full text-left border-collapse bg-surface-dark rounded-xl border border-surface-border overflow-hidden">
             <thead>
                <tr className="bg-background-dark border-b border-surface-border text-gray-400 text-sm">
                   <th className="p-4">標的</th>
                   <th className="p-4">區間</th>
                   <th className="p-4 text-right">初始投入</th>
                   <th className="p-4 text-right">最終淨值</th>
                   <th className="p-4 text-right">報酬率</th>
                   <th className="p-4 text-right">最大回撤</th>
                </tr>
             </thead>
             <tbody className="text-white">
                {history.map((item) => (
                   <tr key={item.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">
                         {item.symbol} <span className="text-gray-500 font-normal text-sm ml-1">{item.stockName}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400 font-mono">
                         {item.config.startDate} ~ {item.config.endDate}
                      </td>
                      <td className="p-4 text-right font-mono">${item.config.investmentAmount.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">${Math.round(item.marketValue).toLocaleString()}</td>
                      <td className={`p-4 text-right font-mono font-bold ${item.returnRate >= 0 ? 'text-profit' : 'text-loss'}`}>
                         {item.returnRate > 0 ? '+' : ''}{item.returnRate.toFixed(2)}%
                      </td>
                      <td className="p-4 text-right font-mono text-loss">{item.maxDrawdown}%</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default ComparisonView;