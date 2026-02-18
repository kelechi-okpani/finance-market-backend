import { NextRequest } from "next/server";
import { getStockQuotes } from "@/lib/marketstack";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/stocks - Get a list of popular stocks with live data
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Default popular stocks logic
    const popularSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
        'V', 'JPM', 'JNJ', 'WMT', 'PG', 'MA', 'XOM', 'CVX'
    ];

    try {
        const quotesMap = await getStockQuotes(popularSymbols);
        const stocks = Array.from(quotesMap.values());

        return corsResponse({
            stocks,
            total: stocks.length,
            stats: {
                gainers: stocks.filter(s => (s.change || 0) > 0).length,
                losers: stocks.filter(s => (s.change || 0) < 0).length,
                sectors: 7 // Static for now matching frontend UI
            }
        }, 200, origin);
    } catch (error) {
        console.error("Market stocks API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
