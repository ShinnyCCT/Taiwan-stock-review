export interface FinMindDividend {
  date: string;
  stock_id: string;
  CashEarningsDistribution: number; // Cash Dividend per share
  StockEarningsDistribution: number; // Stock Dividend per share (e.g. 0.5 means 50 shares per 1000)
}

interface FinMindResponse {
  msg: string;
  status: number;
  data: any[];
}

const FINMIND_API_URL = "https://api.finmindtrade.com/api/v4/data";

// Cache for the full stock list to avoid repeated large fetch
let fullStockListCache: { stock_id: string; stock_name: string }[] | null = null;

export const fetchFinMindDividends = async (
  symbol: string,
  startDate: string,
  endDate: string
): Promise<FinMindDividend[]> => {
  // FinMind requires parameters: dataset, data_id, start_date, end_date
  // dataset for dividends is 'TaiwanStockDividend'
  
  const url = new URL(FINMIND_API_URL);
  url.searchParams.append("dataset", "TaiwanStockDividend");
  url.searchParams.append("data_id", symbol);
  url.searchParams.append("start_date", startDate);
  url.searchParams.append("end_date", endDate);

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.warn(`FinMind API Error: ${response.status}`);
      return [];
    }

    const json: FinMindResponse = await response.json();

    if (json.data && Array.isArray(json.data)) {
        // Map and sort by date
        return json.data
        .map(item => ({
            date: item.date,
            stock_id: item.stock_id,
            CashEarningsDistribution: Number(item.CashEarningsDistribution || 0),
            StockEarningsDistribution: Number(item.StockEarningsDistribution || 0)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch dividends from FinMind:", error);
    return []; // Return empty array on failure so app doesn't crash
  }
};

export const fetchStockInfo = async (stockId: string): Promise<string> => {
  const url = new URL(FINMIND_API_URL);
  url.searchParams.append("dataset", "TaiwanStockInfo");
  url.searchParams.append("data_id", stockId);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return '';
    
    const json: FinMindResponse = await response.json();
    if (json.data && json.data.length > 0) {
      return json.data[0].stock_name || '';
    }
    return '';
  } catch (e) {
    console.warn("Failed to fetch stock info", e);
    return '';
  }
};

/**
 * Searches for a stock ID by name or validates an existing ID.
 * Returns an object { id, name } or null if not found.
 */
export const findStockByKeyword = async (keyword: string): Promise<{ id: string; name: string } | null> => {
  const trimmedKey = keyword.trim();
  
  // If no cache, fetch the full list (without data_id parameter, returns all stocks)
  if (!fullStockListCache) {
    try {
      const url = new URL(FINMIND_API_URL);
      url.searchParams.append("dataset", "TaiwanStockInfo");
      
      const response = await fetch(url.toString());
      const json: FinMindResponse = await response.json();
      
      if (json.data && Array.isArray(json.data)) {
        fullStockListCache = json.data.map((item: any) => ({
          stock_id: item.stock_id,
          stock_name: item.stock_name
        }));
      } else {
        return null;
      }
    } catch (e) {
      console.error("Failed to fetch full stock list for search", e);
      return null;
    }
  }

  if (!fullStockListCache) return null;

  // 1. Try Exact Match on Name
  const exactName = fullStockListCache.find(s => s.stock_name === trimmedKey);
  if (exactName) return { id: exactName.stock_id, name: exactName.stock_name };

  // 2. Try Partial Match on Name
  const partialName = fullStockListCache.find(s => s.stock_name.includes(trimmedKey));
  if (partialName) return { id: partialName.stock_id, name: partialName.stock_name };

  // 3. Try Exact Match on ID (if user typed partial ID like '2330')
  const exactId = fullStockListCache.find(s => s.stock_id === trimmedKey);
  if (exactId) return { id: exactId.stock_id, name: exactId.stock_name };

  return null;
};