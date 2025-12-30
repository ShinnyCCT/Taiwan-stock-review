import React from 'react';
import { BacktestResult } from '../types';
import StockChart from './StockChart';

interface ResultViewProps {
  result: BacktestResult;
}

const ResultView: React.FC<ResultViewProps> = ({ result }) => {
  const isPositive = result.totalReturn >= 0;
  // Taiwan: Profit = Red, Loss = Green.
  const profitColor = "text-profit"; 
  const lossColor = "text-loss";
  const mainColorClass = isPositive ? profitColor : lossColor;
  
  // Calculate percentages for bar charts
  const capitalGainsPct = Math.max(0, Math.min(100, (result.capitalGains / Math.abs(result.totalReturn)) * 100));
  const dividendsPct = Math.max(0, Math.min(100, (result.totalCashDividends / Math.abs(result.totalReturn)) * 100));

  // Helper to format shares into "X張 Y股"
  const formatSharesToSheets = (totalShares: number) => {
    const sheets = Math.floor(totalShares / 1000);
    const oddShares = Math.round(totalShares % 1000);
    
    if (sheets === 0) return `${oddShares}股`;
    if (oddShares === 0) return `${sheets}張`;
    return `${sheets}張 ${oddShares}股`;
  };

  return (
    <div className="animate-fade-in">
      
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Net Profit Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 p-8 rounded-xl bg-surface-dark border border-surface-border shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[100px] text-profit">payments</span>
          </div>
          <p className="text-gray-400 text-base font-medium">總損益 (Net Profit)</p>
          <div className="z-10 relative">
            <p className={`${mainColorClass} text-5xl font-bold tracking-tight`}>
              {isPositive ? '+' : ''}${Math.round(result.totalReturn).toLocaleString()}
            </p>
            {result.benchmark && (
              <p className="text-sm text-gray-400 mt-2 font-mono font-medium">
                vs 006208: {result.benchmark.totalReturn >= 0 ? '+' : ''}${Math.round(result.benchmark.totalReturn).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Total Return Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 p-8 rounded-xl bg-surface-dark border border-surface-border shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[100px] text-profit">percent</span>
          </div>
          <p className="text-gray-400 text-base font-medium">總報酬率 (Total Return)</p>
          <div className="z-10 relative">
            <p className={`${mainColorClass} text-5xl font-bold tracking-tight`}>
               {isPositive ? '+' : ''}{result.returnRate.toFixed(2)}%
            </p>
             {result.benchmark && (
              <p className="text-sm text-gray-400 mt-2 font-mono font-medium">
                vs 006208: {result.benchmark.returnRate >= 0 ? '+' : ''}{result.benchmark.returnRate.toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        {/* Capital Gains Card */}
        <div className="col-span-1 p-8 rounded-xl bg-surface-dark border border-surface-border shadow-sm flex flex-col justify-center gap-1 h-48">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded bg-profit/10 text-profit">
              <span className="material-symbols-outlined text-[24px]">candlestick_chart</span>
            </div>
            <p className="text-gray-400 text-base font-medium">資本利得 (Capital Gains)</p>
          </div>
          <p className={`${result.capitalGains >= 0 ? profitColor : lossColor} text-3xl font-bold tracking-tight`}>
            ${Math.round(result.capitalGains).toLocaleString()}
          </p>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
            <div className={`bg-profit h-2 rounded-full`} style={{ width: `${capitalGainsPct}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Price & Share Growth</p>
        </div>

        {/* Dividends Card */}
        <div className="col-span-1 p-8 rounded-xl bg-surface-dark border border-surface-border shadow-sm flex flex-col justify-center gap-1 h-48">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded bg-yellow-500/10 text-yellow-400">
              <span className="material-symbols-outlined text-[24px]">paid</span>
            </div>
            <p className="text-gray-400 text-base font-medium">現金股息 (Dividends)</p>
          </div>
          <p className="text-yellow-400 text-3xl font-bold tracking-tight">
            ${Math.round(result.totalCashDividends).toLocaleString()}
          </p>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${dividendsPct}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Cash Received</p>
        </div>
      </div>

      {/* 2. Chart Section */}
      <div className="rounded-xl bg-surface-dark border border-surface-border p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-xl font-bold">資產淨值走勢 (Equity Curve)</h3>
            <p className="text-gray-500 text-base">Historical performance over backtest period</p>
          </div>
          <div className="flex bg-background-dark rounded-lg p-1 border border-surface-border">
             {/* Mock buttons for visual fidelity */}
            <button className="px-4 py-1.5 text-sm font-medium bg-surface-border text-white rounded shadow-sm">All</button>
          </div>
        </div>
        <div className="w-full h-80">
           <StockChart data={result.chartData} />
        </div>
      </div>

      {/* 3. Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-6 rounded-xl border border-surface-border bg-background-dark flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Max Drawdown</p>
          <p className="text-loss text-2xl font-bold font-mono">{result.maxDrawdown}%</p>
        </div>
        <div className="p-6 rounded-xl border border-surface-border bg-background-dark flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Initial Shares</p>
          <div>
            <p className="text-white text-2xl font-bold font-mono">{Math.round(result.initialShares)}</p>
            <p className="text-sm text-gray-400 font-mono tracking-wide mt-1">
              {formatSharesToSheets(result.initialShares)}
            </p>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-surface-border bg-background-dark flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Final Shares</p>
          <div>
             <p className="text-white text-2xl font-bold font-mono">{result.finalShares.toFixed(2)}</p>
             <p className="text-sm text-gray-400 font-mono tracking-wide mt-1">
              {formatSharesToSheets(result.finalShares)}
            </p>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-surface-border bg-background-dark flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Events</p>
          <p className="text-white text-2xl font-bold font-mono">{result.events?.length || 0}</p>
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="rounded-xl bg-surface-dark border border-surface-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-white text-xl font-bold">交易明細 (Events Log)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-dark border-b border-surface-border text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-5 font-medium">Date</th>
                <th className="p-5 font-medium">Type</th>
                <th className="p-5 font-medium text-right">Price</th>
                <th className="p-5 font-medium text-right">Shares</th>
                <th className="p-5 font-medium text-right">Div/Share</th>
                <th className="p-5 font-medium text-right">Value (TWD)</th>
                <th className="p-5 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="text-base">
              {result.events?.map((event, index) => {
                 let typeColor = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                 let iconColor = "bg-gray-500";
                 let typeLabel: string = event.type;
                 
                 if (event.type === 'BUY') { typeColor = "bg-profit/10 text-profit border-profit/20"; iconColor = "bg-profit"; }
                 if (event.type === 'SELL') { typeColor = "bg-loss/10 text-loss border-loss/20"; iconColor = "bg-loss"; }
                 if (event.type.includes('DIVIDEND')) { typeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"; iconColor = "bg-yellow-500"; typeLabel = "DIVIDEND"; }

                 return (
                  <tr key={index} className="border-b border-surface-border hover:bg-white/5 transition-colors">
                    <td className="p-5 text-white font-mono">{event.date}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${typeColor}`}>
                        <span className={`w-2 h-2 rounded-full ${iconColor}`}></span>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="p-5 text-white text-right font-mono">
                      {(event.price !== undefined && event.price !== null) ? event.price.toFixed(2) : '-'}
                    </td>
                    <td className="p-5 text-white text-right font-mono">
                      {(event.shares !== undefined && event.shares !== null) ? event.shares.toFixed(2) : '-'}
                    </td>
                    <td className="p-5 text-yellow-400 text-right font-mono">
                      {(event.dividendPerShare !== undefined && event.dividendPerShare !== null) ? `$${event.dividendPerShare.toFixed(2)}` : '-'}
                    </td>
                    <td className={`p-5 text-right font-mono font-bold ${event.type.includes('DIVIDEND') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {/* Show absolute value for clarity, or handle negative amounts */}
                      {(event.amount !== undefined && event.amount !== null) ? `$${Math.round(Math.abs(event.amount)).toLocaleString()}` : '-'}
                    </td>
                     <td className="p-5 text-white text-right font-mono">
                      {(event.balance !== undefined && event.balance !== null) ? `$${Math.round(event.balance).toLocaleString()}` : '-'}
                    </td>
                  </tr>
                 );
              })}
              {!result.events && (
                  <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">No detailed event data available.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-600 mt-10">
        Disclaimer: Quantitative estimates based on historical data. Not financial advice.
      </p>
    </div>
  );
};

export default ResultView;