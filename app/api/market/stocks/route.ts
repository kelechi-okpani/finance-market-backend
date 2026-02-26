import { NextRequest } from "next/server";
import { mockStocks } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/stocks
// Query params: ?sector=Technology&market=NASDAQ&trend=bullish&search=apple&limit=20
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const sector = searchParams.get("sector");
    const market = searchParams.get("market");
    const trend = searchParams.get("trend");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let stocks = [...mockStocks];

    if (sector) stocks = stocks.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
    if (market) stocks = stocks.filter(s => s.market.toLowerCase() === market.toLowerCase());
    if (trend) stocks = stocks.filter(s => s.marketTrend === trend);
    if (search) stocks = stocks.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const gainers = stocks.filter(s => s.change > 0).length;
    const losers = stocks.filter(s => s.change < 0).length;
    const sectors = [...new Set(stocks.map(s => s.sector))];

    return corsResponse({
        stocks: stocks.slice(0, limit),
        total: stocks.length,
        stats: { gainers, losers, sectors: sectors.length },
        availableSectors: sectors,
        availableMarkets: [...new Set(mockStocks.map(s => s.market))],
    }, 200, origin);
}
