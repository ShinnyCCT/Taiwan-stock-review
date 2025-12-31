export interface BacktestInput {
  symbol: string;
  stockName?: string; // Optional user input for better context
  startDate: string;
  endDate: string;
  investmentAmount: number;
  useDRIP: boolean; // Dividend Reinvestment Plan
  feeDiscount: number; // e.g. 6.0 for 6折, 2.8 for 2.8折
  deductTax: boolean; // Whether to deduct 0.3% transaction tax on sell
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface TransactionEvent {
  date: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND_CASH' | 'DIVIDEND_STOCK' | 'SPLIT';
  price?: number;     // Stock price at the time (optional for dividends if not reinvested)
  shares?: number;    // Shares involved (bought/sold/received)
  dividendPerShare?: number; // New field: Cash dividend amount per share
  amount: number;     // Cash value (cost or payout)
  balance: number;    // Portfolio Value after event
}

export interface BenchmarkResult {
  symbol: string;
  totalReturn: number;
  returnRate: number;
}

export interface BacktestResult {
  id: string;          // Unique ID for the session
  timestamp: number;   // When the backtest was run
  config: BacktestInput; // Store the original configuration used
  symbol: string;
  stockName: string;
  currency: string;
  initialPrice: number;
  finalPrice: number;
  initialShares: number;
  finalShares: number;

  // Financial Metrics
  marketValue: number;
  capitalGains: number;
  totalCashDividends: number;
  totalReturn: number;
  returnRate: number;

  // Benchmark (e.g., 0050)
  benchmark?: BenchmarkResult;

  // New Stats for UI
  maxDrawdown: number; // Percentage (e.g., -12.5)
  winRate: number;     // Percentage

  // Charting
  chartData: ChartDataPoint[];

  // Detailed History
  events: TransactionEvent[];
}

export interface LoadingState {
  status: 'idle' | 'searching' | 'calculating' | 'completed' | 'error';
  message: string;
}