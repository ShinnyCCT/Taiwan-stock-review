import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultView from './components/ResultView';
import ComparisonView from './components/ComparisonView'; // New import
import HelpModal from './components/HelpModal'; // New import
import Sidebar from './components/Sidebar'; // New import
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lifted state for InputForm to remember settings
  const [savedConfig, setSavedConfig] = useState<BacktestInput>(DEFAULT_CONFIG);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [history, setHistory] = useState<BacktestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Swipe Gesture Logic
  const touchStartRef = React.useRef<number | null>(null);
  const touchEndRef = React.useRef<number | null>(null);
  const minSwipeDistance = 50; // px

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Right swipe to open sidebar (works from anywhere on screen)
    if (isRightSwipe) {
      setIsMobileMenuOpen(true);
    }
  };

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
    setIsMobileMenuOpen(false); // Close mobile menu on selection
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

  // Common sidebar props to avoid duplication
  const sidebarProps = {
    view,
    setView: (v: 'dashboard' | 'results' | 'comparison') => { setView(v); setIsMobileMenuOpen(false); },
    result,
    setResult,
    history,
    setHistory,
    handleDeleteHistory,
    loadHistoryItem,
    totalHistoryCount
  };

  return (
    <div
      className="flex h-[100dvh] w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Desktop Sidebar - Visible on md+ */}
      <div className="hidden md:flex flex-col w-96 h-full border-r border-surface-border bg-background-dark shrink-0 overflow-y-auto scrollbar-hide">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile Sidebar Overlay & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="relative w-4/5 max-w-xs h-full bg-background-dark border-r border-surface-border shadow-2xl animate-fade-in overflow-y-auto">
            <Sidebar {...sidebarProps} />

            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light dark:bg-background-dark">

        {/* Top Bar / Header */}
        <div className="w-full border-b border-surface-border bg-background-dark/95 backdrop-blur z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">

              {/* Top Row: Title & Actions (Single row on mobile) */}
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white rounded-lg active:bg-surface-dark"
                  >
                    <span className="material-symbols-outlined text-[28px]">menu</span>
                  </button>

                  <h2 className="text-white text-xl md:text-3xl font-bold tracking-tight">
                    {view === 'dashboard' ? '建立新回測' : view === 'results' ? '回測結果總覽' : '多重回測比較'}
                  </h2>
                </div>

                {/* Mobile Actions (Moved here for single row layout) */}
                <div className="md:hidden flex items-center">
                  {view === 'comparison' && (
                    <button onClick={handleNewBacktest} className="flex items-center justify-center gap-1 h-8 px-2 rounded-lg bg-surface-dark hover:bg-surface-border text-white border border-surface-border text-sm font-bold transition-colors whitespace-nowrap">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Back
                    </button>
                  )}
                  {view === 'dashboard' && (
                    <button
                      onClick={() => setShowHelp(true)}
                      className="text-primary text-xs flex items-center gap-1 hover:underline px-2 whitespace-nowrap bg-transparent border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">help</span>
                      如何設定?
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Actions & Result Summary Tags */}
              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">

                {/* Result Tags (Wraps on mobile below title) */}
                {result && view === 'results' && (
                  <div className="flex flex-col gap-2 md:gap-3 mt-1 md:mt-0 md:items-end">
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

                {/* Desktop Buttons (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-3 ml-auto self-center">
                  {view === 'results' && (
                    <button onClick={handleNewBacktest} className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary hover:bg-[#1bc755] text-background-dark text-base font-bold shadow-[0_0_15px_rgba(32,223,96,0.3)] transition-colors whitespace-nowrap">
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      New Backtest
                    </button>
                  )}
                  {view === 'comparison' && (
                    <button onClick={handleNewBacktest} className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-surface-dark hover:bg-surface-border text-white border border-surface-border text-base font-bold transition-colors whitespace-nowrap">
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      Back to Input
                    </button>
                  )}
                  {view === 'dashboard' && (
                    <button
                      onClick={() => setShowHelp(true)}
                      className="text-primary text-sm flex items-center gap-1 hover:underline px-2 whitespace-nowrap bg-transparent border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">help</span>
                      如何設定?
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Mobile Descriptions (Below title/header) */}
            <div className="md:hidden mt-1">
              {/* Result Tags are already handled above in the right column div which wraps on mobile */}
              {/* We just need to ensure Descriptions show up if needed, or if they are hidden/moved */}
              {view === 'comparison' && (
                <div className="flex items-center gap-3 text-gray-400 mt-1">
                  <p className="text-sm">同時檢視多筆模擬結果，分析不同策略或標的之走勢差異。</p>
                </div>
              )}

              {view === 'dashboard' && (
                <p className="text-gray-400 text-xs max-w-2xl">輸入股票代號、設定日期區間與初始資金，系統將為您分析歷史績效與風險指標。</p>
              )}
            </div>

          </div>
        </div>

        {/* Content Body */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide ${view === 'results' ? 'pb-24' : 'pb-12'}`}>
          <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full">

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

        {/* Mobile Sticky New Backtest Button (Only in results view) */}
        {view === 'results' && (
          <div className="md:hidden absolute bottom-6 inset-x-4 z-20 flex justify-center">
            <button
              onClick={handleNewBacktest}
              className="w-[85%] flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-[#1bc755] text-background-dark text-base font-bold transition-all active:shadow-[0_0_20px_rgba(32,223,96,0.6)] active:scale-95 shadow-none"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              建立新回測 (New Backtest)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;