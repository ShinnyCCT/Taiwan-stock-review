export interface FugleCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// FinMind Response Structure
interface FinMindPriceItem {
  date: string;
  stock_id: string;
  Trading_Volume: number;
  Trading_money: number;
  open: number;
  max: number;
  min: number;
  close: number;
  spread: number;
  trading_turnover: number;
}

interface FinMindResponse {
  msg: string;
  status: number;
  data: any[];
}

export interface SplitEvent {
  date: string;
  factor: number; // Adjustment factor (e.g., 0.25 for 1:4 split)
  ratio: number;  // Split ratio (e.g., 4 for 1:4 split) 
  source: 'hardcode' | 'api';
  description: string;
}

const FINMIND_API_BASE = "https://api.finmindtrade.com/api/v4/data";

// --- HARDCODED SPLIT EVENTS ---
// These override or supplement FinMind data for recent/future splits
const HARDCODED_SPLITS: Record<string, SplitEvent[]> = {
  '0050': [{ date: '2025-06-18', factor: 0.25, ratio: 4, source: 'hardcode', description: '1拆4股票分割' }],
  '00663L': [{ date: '2025-06-11', factor: 1 / 7, ratio: 7, source: 'hardcode', description: '1拆7股票分割' }],
  '0052': [{ date: '2025-11-26', factor: 1 / 7, ratio: 7, source: 'hardcode', description: '1拆7股票分割 (富邦科技)' }],
  '00631L': [{ date: '2026-04-01', factor: 1 / 17, ratio: 17, source: 'hardcode', description: '1拆17股票分割 (元大台灣50正2)' }],
  '2327': [{ date: '2025-08-25', factor: 0.25, ratio: 4, source: 'hardcode', description: '1拆4股票分割 (國巨)' }],
  '5314': [{ date: '2025-03-20', factor: 0.05, ratio: 20, source: 'hardcode', description: '1拆20股票分割 (世紀)' }],
  '6415': [{ date: '2022-07-13', factor: 0.25, ratio: 4, source: 'hardcode', description: '1拆4股票分割 (矽力-KY)' }],
  '6548': [{ date: '2022-09-05', factor: 1 / 2.5, ratio: 2.5, source: 'hardcode', description: '1拆2.5股票分割 (長科)' }],
  '5536': [{ date: '2022-09-19', factor: 0.5, ratio: 2, source: 'hardcode', description: '1拆2股票分割 (聖暉)' }],
  '6613': [{ date: '2022-08-29', factor: 0.5, ratio: 2, source: 'hardcode', description: '1拆2股票分割 (朋億)' }],
  '6531': [{ date: '2021-10-18', factor: 0.5, ratio: 2, source: 'hardcode', description: '1拆2股票分割 (愛普)' }],
};

/**
 * Get split events for a symbol within date range
 * Exported so geminiService can use it for share tracking
 */
export const getSplitEvents = (
  symbol: string,
  startDate: string,
  endDate: string
): SplitEvent[] => {
  const hardcoded = HARDCODED_SPLITS[symbol] || [];
  return hardcoded.filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Fetch dividend/split events from FinMind TaiwanStockDividend
 * Used for stock dividends (股票股利) which also require adjustment
 */
const fetchDividendEvents = async (
  symbol: string,
  startDate: string,
  endDate: string
): Promise<SplitEvent[]> => {
  const url = new URL(FINMIND_API_BASE);
  url.searchParams.append("dataset", "TaiwanStockDividend");
  url.searchParams.append("data_id", symbol);
  url.searchParams.append("start_date", startDate);
  url.searchParams.append("end_date", endDate);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const json: FinMindResponse = await response.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    const events: SplitEvent[] = [];

    for (const item of json.data) {
      // Stock Dividend (股票股利) -> Creates adjustment factor
      // Formula: Factor = 1 / (1 + StockEarningsDistribution / 10)
      const stockDiv = Number(item.StockEarningsDistribution || 0);
      if (stockDiv > 0) {
        const factor = 1 / (1 + stockDiv / 10);
        const ratio = 1 + stockDiv / 10;
        events.push({
          date: item.date,
          factor,
          ratio,
          source: 'api',
          description: `股票股利 ${stockDiv}元`
        });
      }
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.warn("Failed to fetch dividend events:", error);
    return [];
  }
};

/**
 * Merge hardcoded splits with API splits
 * Hardcoded takes precedence for same date
 */
const mergeSplitEvents = (
  symbol: string,
  apiEvents: SplitEvent[],
  startDate: string,
  endDate: string
): SplitEvent[] => {
  const hardcoded = HARDCODED_SPLITS[symbol] || [];

  // Filter hardcoded events within date range
  const relevantHardcoded = hardcoded.filter(
    e => e.date >= startDate && e.date <= endDate
  );

  // Create a map of dates to events (hardcoded overrides API)
  const eventMap = new Map<string, SplitEvent>();

  for (const event of apiEvents) {
    eventMap.set(event.date, event);
  }

  for (const event of relevantHardcoded) {
    eventMap.set(event.date, event); // Override API with hardcoded
  }

  return Array.from(eventMap.values()).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Apply Backward Adjustment to price data (FOR CHART DISPLAY ONLY)
 * 
 * Process: For each split/dividend event, multiply all prices BEFORE that date by the factor
 * Volume is divided by the factor (more shares = higher volume historically)
 */
const applyBackwardAdjustment = (
  prices: FugleCandle[],
  events: SplitEvent[]
): FugleCandle[] => {
  if (events.length === 0) return prices;

  // Sort prices by date ascending
  const sortedPrices = [...prices].sort((a, b) => a.date.localeCompare(b.date));

  // Sort events by date descending (process from latest to earliest)
  const sortedEvents = [...events].sort((a, b) => b.date.localeCompare(a.date));

  // For each event, adjust all prices BEFORE the event date
  for (const event of sortedEvents) {
    for (let i = 0; i < sortedPrices.length; i++) {
      if (sortedPrices[i].date < event.date) {
        sortedPrices[i] = {
          ...sortedPrices[i],
          open: sortedPrices[i].open * event.factor,
          high: sortedPrices[i].high * event.factor,
          low: sortedPrices[i].low * event.factor,
          close: sortedPrices[i].close * event.factor,
          volume: sortedPrices[i].volume / event.factor
        };
      }
    }
  }

  return sortedPrices;
};

/**
 * FETCH HISTORICAL DATA
 * 
 * Returns raw prices (no adjustment) for backtest calculation.
 * Use fetchFugleHistoryAdjusted() if you need backward-adjusted prices for charts.
 */
export const fetchFugleHistory = async (
  symbol: string,
  from: string,
  to: string,
  apiKeyOverride?: string
): Promise<FugleCandle[]> => {

  const priceUrl = new URL(FINMIND_API_BASE);
  priceUrl.searchParams.append("dataset", "TaiwanStockPrice");
  priceUrl.searchParams.append("data_id", symbol);
  priceUrl.searchParams.append("start_date", from);
  priceUrl.searchParams.append("end_date", to);

  try {
    const response = await fetch(priceUrl.toString());

    if (!response.ok) {
      throw new Error(`Data Provider Error: ${response.status}`);
    }

    const json: FinMindResponse = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      return [];
    }

    // Map FinMind format to our internal Candle format (RAW prices)
    return json.data.map((item: FinMindPriceItem) => ({
      date: item.date,
      open: item.open,
      high: item.max,
      low: item.min,
      close: item.close,
      volume: item.Trading_Volume
    }));
  } catch (error) {
    console.error("Failed to fetch history:", error);
    throw new Error("無法取得股價資料 (Network Error)。可能是股票代號錯誤，或資料來源暫時無法存取。");
  }
};

/**
 * FETCH HISTORICAL DATA WITH BACKWARD ADJUSTMENT (FOR CHARTS)
 * 
 * Returns backward-adjusted prices suitable for chart display.
 * The prices are adjusted so the chart shows a continuous line without jumps at splits.
 */
export const fetchFugleHistoryAdjusted = async (
  symbol: string,
  from: string,
  to: string
): Promise<FugleCandle[]> => {
  // 1. Fetch raw prices
  const rawPrices = await fetchFugleHistory(symbol, from, to);

  // 2. Fetch dividend/split events from API
  const apiEvents = await fetchDividendEvents(symbol, from, to);

  // 3. Merge with hardcoded splits
  const allEvents = mergeSplitEvents(symbol, apiEvents, from, to);

  // 4. Apply backward adjustment
  if (allEvents.length > 0) {
    console.log(`[${symbol}] Applying backward adjustment for ${allEvents.length} event(s):`,
      allEvents.map(e => `${e.date} (factor: ${e.factor.toFixed(4)}, source: ${e.source})`));
    return applyBackwardAdjustment(rawPrices, allEvents);
  }

  return rawPrices;
};