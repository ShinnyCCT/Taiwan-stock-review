import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultView from './components/ResultView';
import ComparisonView from './components/ComparisonView'; // New import
import HelpModal from './components/HelpModal'; // New import
import { BacktestInput, BacktestResult, LoadingState } from './types';
import { runBacktest } from './services/geminiService';

// Helper to get yesterday's date string (UTC based for consistency with toISOString)
const getYesterdayDateStr = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

// Default configuration
const DEFAULT_CONFIG: BacktestInput = {
  symbol: '2330',
  stockName: '',
  startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // 1 year ago
  endDate: getYesterdayDateStr(), // Default to yesterday
  investmentAmount: 100000,
  useDRIP: true,
  feeDiscount: 6.0,
  deductTax: true
};

const App: React.FC = () => {
  // Added 'comparison' to view state type
  const [view, setView] = useState<'dashboard' | 'results' | 'comparison'>('dashboard');
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle', message: '' });
  const [showHelp, setShowHelp] = useState(false);

  // Lifted state for InputForm to remember settings
  const [savedConfig, setSavedConfig] = useState<BacktestInput>(DEFAULT_CONFIG);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [history, setHistory] = useState<BacktestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleBacktest = async (input: BacktestInput) => {
    // Save the configuration being used
    setSavedConfig(input);

    // Reset states before starting
    setError(null);
    setResult(null);
    setLoadingState({ status: 'searching', message: '正在搜尋歷史股價與 006208 比較基準...' });

    try {
      // Direct call without artificial delay to prevent race conditions
      const data = await runBacktest(input);
      setResult(data);
      setLoadingState({ status: 'completed', message: '' });
      setView('results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "發生未知錯誤");
      setLoadingState({ status: 'error', message: '' });
    }
  };

  const handleNewBacktest = () => {
    // Save current result to history if it exists
    if (result) {
      const exists = history.some(h => h.id === result.id);
      if (!exists) {
        setHistory(prev => [result, ...prev]);
      }
    }

    // Clear current result and go to dashboard
    setResult(null);
    setError(null);
    setLoadingState({ status: 'idle', message: '' });
    setView('dashboard');
  };

  const loadHistoryItem = (item: BacktestResult) => {
    // CRITICAL FIX: Before loading a history item, save the CURRENT active result 
    // to history if it's not already there. Otherwise, the current simulation is lost 
    // when switching, which users perceive as "deleting" or "losing" data.
    if (result && result.id !== item.id) {
      const exists = history.some(h => h.id === result.id);
      if (!exists) {
        setHistory(prev => [result, ...prev]);
      }
    }

    setResult(item);
    setView('results');
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering loadHistoryItem

    // Remove from history
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);

    // If we are currently viewing the deleted item, go back to dashboard
    if (result && result.id === id) {
      setResult(null);
      setView('dashboard');
    }
  };

  // Calculate total items available for comparison (history + current result if unique)
  const totalHistoryCount = history.length + (result && !history.some(h => h.id === result.id) ? 1 : 0);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden">

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Sidebar - Width increased from w-80 to w-96 */}
      <div className="hidden md:flex flex-col w-96 h-full border-r border-surface-border bg-background-dark shrink-0 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col min-h-full p-5 justify-between">
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
                          <button
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="刪除紀錄"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light dark:bg-background-dark">

        {/* Top Bar / Header */}
        <div className="w-full border-b border-surface-border bg-background-dark/95 backdrop-blur z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
              <div className="flex flex-col gap-1 md:gap-2 w-full md:w-auto">
                <h2 className="text-white text-xl md:text-3xl font-bold tracking-tight">
                  {view === 'dashboard' ? '建立新回測' : view === 'results' ? '回測結果總覽' : '多重回測比較'}
                </h2>

                {result && view === 'results' && (
                  <div className="flex flex-col gap-2 md:gap-3 mt-1">
                    {/* ... Existing Result View Header content ... */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-gray-300">
                      <span className="bg-surface-dark px-2 py-0.5 md:px-3 md:py-1 rounded text-sm md:text-base font-mono font-bold text-white border border-surface-border tracking-wider">{result.symbol}</span>
                      <span className="text-base md:text-lg font-medium">{result.stockName}</span>
                      <span className="hidden md:inline-block w-1.5 h-1.5 bg-gray-600 rounded-full mx-1"></span>
                      <span className="text-primary text-xs md:text-sm font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">check_circle</span>
                        <span className="hidden md:inline">Calculation Completed</span>
                        <span className="md:hidden">Done</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                      <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-surface-dark border border-surface-border text-gray-400 text-xs md:text-sm">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">calendar_today</span>
                        <span className="font-mono">{result.config.startDate} ~ {result.config.endDate}</span>
                      </div>

                      <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-surface-dark border border-surface-border text-gray-400 text-xs md:text-sm">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">attach_money</span>
                        <span className="font-mono">${result.config.investmentAmount.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-surface-dark border border-surface-border text-gray-400 text-xs md:text-sm">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">percent</span>
                        <span>{result.config.feeDiscount}折</span>
                      </div>

                      {result.config.useDRIP && (
                        <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-surface-dark border border-surface-border text-primary text-xs md:text-sm">
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">check</span>
                          <span>DRIP</span>
                        </div>
                      )}

                      {result.config.deductTax && (
                        <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-surface-dark border border-surface-border text-gray-400 text-xs md:text-sm">
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">account_balance</span>
                          <span>含稅</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {view === 'comparison' && (
                  <div className="flex items-center gap-3 text-gray-400 mt-1">
                    <p className="text-sm md:text-base">同時檢視多筆模擬結果，分析不同策略或標的之走勢差異。</p>
                  </div>
                )}

                {view === 'dashboard' && (
                  <p className="text-gray-400 text-xs md:text-sm max-w-2xl">輸入股票代號、設定日期區間與初始資金，系統將為您分析歷史績效與風險指標。</p>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-3 ml-auto self-start md:self-center">
                {view === 'results' && (
                  <button onClick={handleNewBacktest} className="flex items-center justify-center gap-1 md:gap-2 h-9 px-3 md:h-11 md:px-6 rounded-lg bg-primary hover:bg-[#1bc755] text-background-dark text-sm md:text-base font-bold shadow-[0_0_15px_rgba(32,223,96,0.3)] transition-colors whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">add</span>
                    New Backtest
                  </button>
                )}
                {view === 'comparison' && (
                  <button onClick={handleNewBacktest} className="flex items-center justify-center gap-1 md:gap-2 h-9 px-3 md:h-11 md:px-6 rounded-lg bg-surface-dark hover:bg-surface-border text-white border border-surface-border text-sm md:text-base font-bold transition-colors whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">arrow_back</span>
                    Back to Input
                  </button>
                )}
                {view === 'dashboard' && (
                  <button
                    onClick={() => setShowHelp(true)}
                    className="text-primary text-xs md:text-sm flex items-center gap-1 hover:underline px-2 whitespace-nowrap bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[18px]">help</span>
                    如何設定?
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-12 h-full">

            {/* View: Dashboard / Input */}
            {view === 'dashboard' && (
              <div className="w-full pt-4">
                <InputForm
                  initialValues={savedConfig}
                  onSubmit={handleBacktest}
                  isLoading={loadingState.status === 'searching' || loadingState.status === 'calculating'}
                />

                {/* Loading State Overlay */}
                {(loadingState.status === 'searching' || loadingState.status === 'calculating') && (
                  <div className="mt-8 p-8 rounded-xl border border-surface-border bg-surface-dark flex items-center justify-center gap-4 animate-pulse">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-primary text-lg font-medium">{loadingState.message}</p>
                  </div>
                )}

                {error && (
                  <div className="mt-8 p-6 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-4 text-red-400 text-lg">
                    <span className="material-symbols-outlined text-[28px]">error</span>
                    <p>{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* View: Results */}
            {view === 'results' && result && (
              <ResultView result={result} />
            )}

            {/* View: Comparison */}
            {view === 'comparison' && (
              <ComparisonView
                history={result && !history.some(h => h.id === result.id) ? [result, ...history] : history}
                onBack={handleNewBacktest}
              />
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default App;