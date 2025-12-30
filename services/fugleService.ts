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
  data: FinMindPriceItem[];
}

const FINMIND_API_BASE = "https://api.finmindtrade.com/api/v4/data";

/**
 * FETCH HISTORICAL DATA
 * 
 * Note: We have switched from Fugle to FinMind for price data.
 * Reason: Fugle API enforces strict CORS policies which block direct browser requests
 * without a proxy. FinMind allows client-side requests (CORS enabled), making it
 * more stable for this frontend-only application.
 */
export const fetchFugleHistory = async (
  symbol: string,
  from: string,
  to: string,
  apiKeyOverride?: string
): Promise<FugleCandle[]> => {
  
  // FinMind Parameters
  const url = new URL(FINMIND_API_BASE);
  url.searchParams.append("dataset", "TaiwanStockPrice");
  url.searchParams.append("data_id", symbol);
  url.searchParams.append("start_date", from);
  url.searchParams.append("end_date", to);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Data Provider Error: ${response.status}`);
    }

    const json: FinMindResponse = await response.json();

    if (json.data && Array.isArray(json.data)) {
      // Map FinMind format to our internal Candle format
      return json.data.map(item => ({
        date: item.date,
        open: item.open,
        high: item.max,
        low: item.min,
        close: item.close,
        volume: item.Trading_Volume
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch history:", error);
    // Throw a user-friendly error
    throw new Error("無法取得股價資料 (Network Error)。可能是股票代號錯誤，或資料來源暫時無法存取。");
  }
};