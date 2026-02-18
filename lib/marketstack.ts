const MARKETSTACK_API_KEY = process.env.MARKETSTACK_API_KEY;
const BASE_URL = 'http://api.marketstack.com/v1';

export interface StockQuote {
    symbol: string;
    name?: string;
    price: number;
    change?: number;
    change_percent?: number;
    volume?: number;
    market_cap?: number;
    currency?: string;
}

/**
 * Fetch real-time or latest end-of-day data for a list of symbols
 */
export async function getStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    if (!MARKETSTACK_API_KEY) {
        console.warn("MARKETSTACK_API_KEY is not set. Returning mock data.");
        return createMockQuotes(symbols);
    }

    try {
        const symbolsString = symbols.join(',');
        const response = await fetch(
            `${BASE_URL}/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbolsString}`
        );

        const result = await response.json();

        if (!result.data) {
            console.error("MarketStack Error:", result.error || "Unknown error");
            return createMockQuotes(symbols);
        }

        const quotes = new Map<string, StockQuote>();

        result.data.forEach((item: any) => {
            quotes.set(item.symbol, {
                symbol: item.symbol,
                price: item.close,
                // MarketStack free tier limited data, we'll supplement where possible
                volume: item.volume,
            });
        });

        return quotes;
    } catch (error) {
        console.error("Failed to fetch from MarketStack:", error);
        return createMockQuotes(symbols);
    }
}

/**
 * Search for stocks by keyword
 */
export async function searchStocks(query: string) {
    if (!MARKETSTACK_API_KEY) return [];

    try {
        const response = await fetch(
            `${BASE_URL}/tickers?access_key=${MARKETSTACK_API_KEY}&search=${encodeURIComponent(query)}&limit=10`
        );
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error("MarketStack search error:", error);
        return [];
    }
}

/**
 * Fallback to mock data if API key is missing or fails (for development/demo)
 */
function createMockQuotes(symbols: string[]): Map<string, StockQuote> {
    const quotes = new Map<string, StockQuote>();

    const mockValues: Record<string, { price: number; name: string }> = {
        'AAPL': { price: 192.30, name: 'Apple Inc.' },
        'MSFT': { price: 412.60, name: 'Microsoft Corp.' },
        'GOOGL': { price: 168.90, name: 'Alphabet Inc.' },
        'AMZN': { price: 198.45, name: 'Amazon.com Inc.' },
        'TSLA': { price: 248.90, name: 'Tesla Inc.' },
        'NVDA': { price: 878.40, name: 'NVIDIA Corp.' },
        'META': { price: 485.20, name: 'Meta Platforms Inc.' },
    };

    symbols.forEach(symbol => {
        const mock = mockValues[symbol.toUpperCase()] || { price: 100.00, name: symbol };
        quotes.set(symbol.toUpperCase(), {
            symbol: symbol.toUpperCase(),
            name: mock.name,
            price: mock.price,
            change: (Math.random() * 10) - 5,
            change_percent: (Math.random() * 4) - 2,
        });
    });

    return quotes;
}
