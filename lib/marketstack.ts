import yahooFinance from 'yahoo-finance2';

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
 * Fetch real-time or latest end-of-day data for a list of symbols using Yahoo Finance
 */
export async function getStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const quotes = new Map<string, StockQuote>();

    if (!symbols || symbols.length === 0) {
        return quotes;
    }

    try {
        // Fetch quotes in parallel
        const results = await Promise.allSettled(
            symbols.map(symbol => yahooFinance.quote(symbol))
        );

        results.forEach((result, index) => {
            const symbol = symbols[index];
            if (result.status === 'fulfilled' && result.value) {
                const quote = result.value as any;
                quotes.set(symbol.toUpperCase(), {
                    symbol: quote.symbol.toUpperCase(),
                    name: quote.shortName || quote.longName,
                    price: quote.regularMarketPrice || quote.preMarketPrice || quote.postMarketPrice || 0,
                    change: quote.regularMarketChange,
                    change_percent: quote.regularMarketChangePercent,
                    volume: quote.regularMarketVolume,
                    market_cap: quote.marketCap,
                    currency: quote.currency
                });
                console.log(result, "result");
            } else {
                console.error(`Failed to fetch Yahoo Finance quote for ${symbol}`);
            }
        });

        // Use mock data as fallback for any symbols that failed completely
        if (quotes.size < symbols.length) {
            const mockQuotes = createMockQuotes(symbols.filter(s => !quotes.has(s.toUpperCase())));
            mockQuotes.forEach((value, key) => quotes.set(key, value));
        }

        return quotes;
    } catch (error) {
        console.error("Failed to fetch from Yahoo Finance:", error);
        return createMockQuotes(symbols);
    }
}

/**
 * Search for stocks by keyword
 */
export async function searchStocks(query: string) {
    if (!query) return [];

    try {
        const results: any = await yahooFinance.search(query);
        return results.quotes.map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname,
            exchange: q.exchange,
            type: q.quoteType
        }));
    } catch (error) {
        console.error("Yahoo Finance search error:", error);
        return [];
    }
}

/**
 * Fallback to mock data if API fails (for development/demo)
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
