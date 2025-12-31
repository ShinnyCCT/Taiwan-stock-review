import { BacktestInput, BacktestResult, ChartDataPoint, TransactionEvent } from "../types";
import { fetchFugleHistory, FugleCandle } from "./fugleService";
import { fetchFinMindDividends, FinMindDividend, fetchStockInfo, findStockByKeyword } from "./finMindService";

// --- Constants for TW Stock Market ---
const TW_TAX_RATE = 0.003; // 0.3% Securities Transaction Tax
const TW_FEE_RATE = 0.001425; // 0.1425% Brokerage Fee
const MIN_FEE = 20;

// --- Stock Split Events ---
// 0050: 1:4 split, effective 2025-06-18 (first trading day after split)
// 00663L: 1:7 split, effective 2025-06-11 (first trading day after split)
const SPLIT_EVENTS = [
  { symbol: '0050', effectiveDate: '2025-06-18', ratio: 4, description: '1拆4股票分割' },
  { symbol: '00663L', effectiveDate: '2025-06-11', ratio: 7, description: '1拆7股票分割' },
];

// --- Helper: Local Math Calculation ---
const calculateBacktestStrategy = (
  prices: FugleCandle[],
  dividends: FinMindDividend[],
  input: BacktestInput,
  fetchedStockName: string
): Omit<BacktestResult, 'id' | 'timestamp' | 'benchmark' | 'config'> => {

  // Sort data strictly by date
  const sortedPrices = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedDividends = [...dividends].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedPrices.length === 0) {
    throw new Error(`代號 ${input.symbol} 沒有股價資料，無法進行回測`);
  }

  // --- 1. Initial State ---
  const startDate = sortedPrices[0].date;
  const endDate = sortedPrices[sortedPrices.length - 1].date;

  let cashBalance = input.investmentAmount;
  let shares = 0;
  let totalCashDividends = 0;
  const events: TransactionEvent[] = [];
  const chartData: ChartDataPoint[] = [];

  // Fee Multiplier
  const feeDiscountMultiplier = input.feeDiscount / 10;

  // --- 2. BUY (Entry) ---
  const entryPrice = sortedPrices[0].open;

  const estimatedShares = Math.floor(cashBalance / (entryPrice * (1 + TW_FEE_RATE * feeDiscountMultiplier)));
  const buyCost = estimatedShares * entryPrice;
  let buyFee = Math.floor(buyCost * TW_FEE_RATE * feeDiscountMultiplier);
  if (buyFee < MIN_FEE) buyFee = MIN_FEE;

  if (estimatedShares > 0 && (buyCost + buyFee) <= cashBalance) {
    shares += estimatedShares;
    cashBalance -= (buyCost + buyFee);

    events.push({
      date: startDate,
      type: 'BUY',
      price: entryPrice,
      shares: estimatedShares,
      amount: -(buyCost + buyFee),
      balance: cashBalance + (shares * entryPrice)
    });
  }

  // --- 3. Iterate through Days ---
  let maxAssetValue = -Infinity;
  let maxDrawdown = 0;

  // Dividend Queue Pointer
  let divIndex = 0;

  // Split Tracker - keep track of which splits have been applied
  const applicableSplits = SPLIT_EVENTS.filter(s => s.symbol === input.symbol);
  const appliedSplits = new Set<string>();

  for (const dayCandle of sortedPrices) {
    const todayStr = dayCandle.date;
    const closePrice = dayCandle.close;

    // A0. Check for Stock Splits
    for (const split of applicableSplits) {
      if (!appliedSplits.has(split.effectiveDate) && todayStr >= split.effectiveDate) {
        const sharesBefore = shares;
        shares = shares * split.ratio;
        appliedSplits.add(split.effectiveDate);

        events.push({
          date: split.effectiveDate,
          type: 'SPLIT',
          shares: shares - sharesBefore, // Net new shares
          amount: 0, // No cash changes
          balance: cashBalance + (shares * closePrice)
        });
      }
    }

    // A. Check for Dividends (Queue Check)
    // Process any dividends that have occurred on or before this date and haven't been processed
    while (divIndex < sortedDividends.length) {
      const div = sortedDividends[divIndex];

      // Use string comparison (YYYY-MM-DD)
      if (div.date > todayStr) {
        // Dividend is in the future, stop checking queue for today
        break;
      }

      // Process this dividend (div.date <= todayStr)

      // Stock Dividend
      if (div.StockEarningsDistribution > 0) {
        const stockDivRatio = div.StockEarningsDistribution / 10;
        const newShares = Math.floor(shares * stockDivRatio);

        if (newShares > 0) {
          shares += newShares;
          events.push({
            date: todayStr, // Log event on the trading day applied
            type: 'DIVIDEND_STOCK',
            shares: newShares,
            amount: 0,
            balance: cashBalance + (shares * closePrice)
          });
        }
      }

      // Cash Dividend
      if (div.CashEarningsDistribution > 0) {
        const cashPayout = Math.floor(shares * div.CashEarningsDistribution);
        totalCashDividends += cashPayout;

        // DRIP
        if (input.useDRIP) {
          const reinvestPrice = closePrice;
          const reinvestShares = Math.floor(cashPayout / reinvestPrice);
          const reinvestCost = reinvestShares * reinvestPrice;
          let reinvestFee = Math.floor(reinvestCost * TW_FEE_RATE * feeDiscountMultiplier);
          if (reinvestFee < MIN_FEE && reinvestShares > 0) reinvestFee = MIN_FEE;

          if (reinvestShares > 0 && (reinvestCost + reinvestFee) <= cashPayout) {
            shares += reinvestShares;
            const remainingCash = cashPayout - (reinvestCost + reinvestFee);
            cashBalance += remainingCash;

            events.push({
              date: todayStr, // Log event on the trading day applied
              type: 'DIVIDEND_CASH',
              dividendPerShare: div.CashEarningsDistribution,
              amount: cashPayout,
              shares: reinvestShares,
              balance: cashBalance + (shares * closePrice)
            });
          } else {
            cashBalance += cashPayout;
            events.push({
              date: todayStr,
              type: 'DIVIDEND_CASH',
              dividendPerShare: div.CashEarningsDistribution,
              amount: cashPayout,
              shares: 0,
              balance: cashBalance + (shares * closePrice)
            });
          }
        } else {
          cashBalance += cashPayout;
          events.push({
            date: todayStr,
            type: 'DIVIDEND_CASH',
            dividendPerShare: div.CashEarningsDistribution,
            amount: cashPayout,
            shares: 0,
            balance: cashBalance + (shares * closePrice)
          });
        }
      }

      // Move to next dividend
      divIndex++;
    }

    // B. Update Chart
    const currentAssetValue = cashBalance + (shares * closePrice);
    chartData.push({
      date: todayStr,
      value: currentAssetValue
    });

    if (currentAssetValue > maxAssetValue) {
      maxAssetValue = currentAssetValue;
    }

    const drawdown = ((currentAssetValue - maxAssetValue) / maxAssetValue) * 100;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // --- 4. SELL (Exit) ---
  const exitPrice = sortedPrices[sortedPrices.length - 1].close;
  const sellProceeds = shares * exitPrice;

  let sellFee = Math.floor(sellProceeds * TW_FEE_RATE * feeDiscountMultiplier);
  if (sellFee < MIN_FEE) sellFee = MIN_FEE;

  const sellTax = input.deductTax ? Math.floor(sellProceeds * TW_TAX_RATE) : 0;

  const finalCash = cashBalance + sellProceeds - sellFee - sellTax;

  events.push({
    date: endDate,
    type: 'SELL',
    price: exitPrice,
    shares: shares,
    amount: (sellProceeds - sellFee - sellTax),
    balance: finalCash
  });

  const finalMarketValue = finalCash;
  const capitalGains = finalMarketValue - input.investmentAmount - totalCashDividends;
  const totalReturn = finalMarketValue - input.investmentAmount;
  const returnRate = (totalReturn / input.investmentAmount) * 100;

  return {
    symbol: input.symbol,
    stockName: input.stockName || fetchedStockName || input.symbol,
    currency: 'TWD',
    initialPrice: entryPrice,
    finalPrice: exitPrice,
    initialShares: estimatedShares,
    finalShares: shares,
    marketValue: finalMarketValue,
    capitalGains: capitalGains,
    totalCashDividends: totalCashDividends,
    totalReturn: totalReturn,
    returnRate: returnRate,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    winRate: 100,
    chartData: chartData,
    events: events
  };
};

export const runBacktest = async (input: BacktestInput): Promise<BacktestResult> => {
  try {
    // 0. Resolve Stock ID (Handle Name Search)
    let targetSymbol = input.symbol.trim();
    let targetName = input.stockName || '';

    // If input is NOT strictly digits (e.g. contains Chinese or '台積電'), treat as name search
    if (!/^\d+$/.test(targetSymbol)) {
      const found = await findStockByKeyword(targetSymbol);
      if (found) {
        targetSymbol = found.id;
        targetName = found.name;
      } else {
        throw new Error(`找不到名稱或代號包含「${input.symbol}」的股票。請檢查輸入或嘗試使用完整代號 (例如 2330)。`);
      }
    }

    // Update input for calculation consistency (so internal logic uses the ID)
    const processedInput: BacktestInput = {
      ...input,
      symbol: targetSymbol,
      stockName: targetName
    };

    // Changed benchmark from 0050 to 006208 (Fubon Taiwan 50) as requested
    const benchmarkSymbol = '006208';
    const isTargetBenchmark = targetSymbol === benchmarkSymbol;

    // Parallel Fetch: Target Stock + Benchmark
    const targetPromise = Promise.all([
      fetchFugleHistory(targetSymbol, input.startDate, input.endDate),
      fetchFinMindDividends(targetSymbol, input.startDate, input.endDate),
      // If we already resolved the name via search, use it, otherwise fetch it
      targetName ? Promise.resolve(targetName) : fetchStockInfo(targetSymbol)
    ]);

    // Only fetch benchmark if target isn't the benchmark itself
    const benchmarkPromise = !isTargetBenchmark
      ? Promise.all([
        fetchFugleHistory(benchmarkSymbol, input.startDate, input.endDate),
        fetchFinMindDividends(benchmarkSymbol, input.startDate, input.endDate)
      ])
      : Promise.resolve(null);

    const [[fugleData, finMindData, fetchedStockName], benchmarkData] = await Promise.all([targetPromise, benchmarkPromise]);

    // 1. Calculate Target Strategy
    const calculatedResult = calculateBacktestStrategy(fugleData, finMindData, processedInput, fetchedStockName);

    // 2. Calculate Benchmark Strategy (if available)
    let benchmarkResult = undefined;
    if (benchmarkData) {
      const [benchPrice, benchDivs] = benchmarkData;
      const benchInput: BacktestInput = { ...processedInput, symbol: benchmarkSymbol };

      try {
        const res = calculateBacktestStrategy(benchPrice, benchDivs, benchInput, '富邦台50');
        benchmarkResult = {
          symbol: benchmarkSymbol,
          totalReturn: res.totalReturn,
          returnRate: res.returnRate
        };
      } catch (e) {
        console.warn("Failed to calculate benchmark strategy", e);
      }
    }

    return {
      ...calculatedResult,
      benchmark: benchmarkResult,
      // We store the *resolved* symbol in the result display so it matches the data
      symbol: targetSymbol,
      // But we keep the config showing what was actually used for calculation
      config: processedInput,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("Backtest failed:", error);
    if (error.message.includes("No price data") || error.message.includes("API")) {
      throw new Error("無法取得股價資料。請檢查更換股票代碼/日期範圍，或確認 API 服務狀態。");
    }
    // Re-throw user friendly errors directly
    throw error;
  }
};