import React from 'react';
import { BacktestResult } from '../types';

interface SidebarProps {
    view: 'dashboard' | 'results' | 'comparison';
    setView: (view: 'dashboard' | 'results' | 'comparison') => void;
    result: BacktestResult | null;
    setResult: (result: BacktestResult | null) => void;
    history: BacktestResult[];
    setHistory: React.Dispatch<React.SetStateAction<BacktestResult[]>>;
    handleDeleteHistory: (e: React.MouseEvent, id: string) => void;
    loadHistoryItem: (item: BacktestResult) => void;
    totalHistoryCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    view,
    setView,
    result,
    setResult,
    history,
    setHistory,
    handleDeleteHistory,
    loadHistoryItem,
    totalHistoryCount,
}) => {
    return (
        <div className="flex flex-col min-h-full p-4 md:p-5 justify-between">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full h-9 w-9 bg-surface-dark flex items-center justify-center border border-surface-border text-primary shrink-0">
                        <span className="material-symbols-outlined text-[24px]">candlestick_chart</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-xl font-bold tracking-tight leading-none">Retrace.tw</h1>
                        <span className="text-xs text-gray-500 font-medium tracking-wide">Built by CCT</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${view === 'dashboard' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-surface-dark'}`}
                    >
                        <span className={`material-symbols-outlined text-[26px] ${view === 'dashboard' ? 'fill-1' : 'group-hover:text-primary transition-colors'}`}>dashboard</span>
                        <span className={`text-base ${view === 'dashboard' ? 'font-bold' : 'font-medium'}`}>開始回測 (Start)</span>
                    </button>

                    <div className="flex flex-col">
                        <button
                            onClick={() => result && setView('results')}
                            disabled={!result && history.length === 0}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${view === 'results' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-surface-dark disabled:opacity-50 disabled:cursor-not-allowed'}`}
                        >
                            <span className={`material-symbols-outlined text-[26px] ${view === 'results' ? 'fill-1' : 'group-hover:text-primary transition-colors'}`}>trending_up</span>
                            <span className={`text-base ${view === 'results' ? 'font-bold' : 'font-medium'}`}>回測結果 (Results)</span>
                        </button>

                        {/* History Sub-list */}
                        {(history.length > 0 || (result && !history.some(h => h.id === result.id))) && (
                            <div className="flex flex-col mt-3 ml-4 pl-4 border-l border-surface-border gap-2">
                                {/* Active Result if not in history list yet */}
                                {result && !history.some(h => h.id === result.id) && (
                                    <div className="group relative">
                                        <button
                                            onClick={() => setView('results')}
                                            className={`text-left px-4 py-3 rounded-md transition-colors w-full ${view === 'results' ? 'bg-surface-dark border border-surface-border' : 'hover:bg-surface-dark/50'}`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex flex-col items-start min-w-0 mr-3 overflow-hidden">
                                                    <span className={`text-base font-bold truncate ${view === 'results' ? 'text-white' : 'text-gray-300'}`}>{result.symbol}</span>
                                                    <span className="text-sm text-gray-500 truncate">{result.stockName || '台股'}</span>
                                                </div>
                                                <span className={`text-lg font-mono font-bold whitespace-nowrap ml-auto ${result.totalReturn >= 0 ? "text-profit" : "text-loss"}`}>
                                                    {result.returnRate >= 0 ? '+' : ''}{result.returnRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {history.map((item) => {
                                    const isActive = view === 'results' && result?.id === item.id;
                                    return (
                                        <div key={item.id} className="relative group">
                                            <button
                                                onClick={() => loadHistoryItem(item)}
                                                className={`text-left px-4 py-3 rounded-md transition-colors w-full pr-16 ${isActive ? 'bg-surface-dark border border-surface-border' : 'hover:bg-surface-dark/50'}`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <div className="flex flex-col items-start min-w-0 mr-3 overflow-hidden">
                                                        <span className={`text-base font-bold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>{item.symbol}</span>
                                                        <span className="text-sm text-gray-500 truncate">{item.stockName || '台股'}</span>
                                                    </div>
                                                    <span className={`text-lg font-mono font-bold whitespace-nowrap ml-auto ${item.totalReturn >= 0 ? "text-profit" : "text-loss"}`}>
                                                        {item.returnRate >= 0 ? '+' : ''}{item.returnRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Delete Button */}
                                          {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-600 md:text-gray-500 hover:text-red-500 hover:bg-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10"
                        title="刪除紀錄"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>                      </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {/* Replaced User Profile with Comparison Button */}
                <div className="mt-2 border-t border-surface-border pt-4">
                    <button
                        onClick={() => {
                            // Ensure current result is in history before comparing
                            if (result && !history.some(h => h.id === result.id)) {
                                setHistory(prev => [result, ...prev]);
                            }
                            setView('comparison');
                        }}
                        disabled={totalHistoryCount === 0}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-all ${view === 'comparison'
                                ? 'bg-primary text-background-dark border-primary font-bold shadow-lg shadow-primary/20'
                                : totalHistoryCount >= 2
                                    ? 'bg-yellow-500 text-background-dark border-yellow-500 font-bold shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 animate-pulse'
                                    : 'bg-surface-dark border-surface-border text-gray-300 hover:text-white hover:bg-surface-border'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <span className="material-symbols-outlined text-[24px]">compare_arrows</span>
                        <span className="text-base font-bold">比較所有回測</span>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Sidebar;
