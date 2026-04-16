import yahooFinance from 'yahoo-finance2';

export interface MarketItem {
    symbol: string;
    name?: string;
    price: number;
    change?: number;
    change_percent?: number;
    currency?: string;
    quoteType?: string;
    market?: string;
}

export async function getMarketData(symbols: string[]): Promise<Map<string, MarketItem>> {
    const items = new Map<string, MarketItem>();
    if (!symbols?.length) return items;

    const uniqueSymbols = Array.from(new Set(symbols.map(s => s.trim().toUpperCase())));

    try {
        // STEP 1: Handshake. This often "warms up" the session cookies.
        await yahooFinance.trendingSymbols('US').catch(() => { });

        // STEP 2: The Call. 
        // We use a high-quality browser User-Agent to avoid the 503/Unauthorized error.
        const results = await (yahooFinance.quote(uniqueSymbols, {
            validateResult: false,
        }, {
            fetchOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Referer': 'https://finance.yahoo.com/',
                }
            }
        }) as Promise<any>);

        const resultArray = Array.isArray(results) ? results : [results];

        resultArray.forEach((quote: any) => {
            if (quote && (quote.regularMarketPrice !== undefined || quote.bid !== undefined)) {
                items.set(quote.symbol.toUpperCase(), {
                    symbol: quote.symbol.toUpperCase(),
                    name: quote.shortName || quote.longName,
                    price: quote.regularMarketPrice ?? quote.bid ?? 0,
                    change: quote.regularMarketChange,
                    change_percent: quote.regularMarketChangePercent,
                    currency: quote.currency,
                    quoteType: quote.quoteType,
                    market: quote.market,
                });
            }
        });

        return items;
    } catch (error: any) {
        console.error("Yahoo API Blocked:", error?.message);
        throw error;
    }
}