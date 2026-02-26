import { NextRequest } from "next/server";
import { mockStocks, mockBonds, mockETFs, mockMutualFunds, mockCommodities } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/screener - Real counts from mock data
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const sectors = [...new Set(mockStocks.map(s => s.sector))];
    const gainers = mockStocks.filter(s => s.change > 0);
    const losers = mockStocks.filter(s => s.change < 0);

    const data = {
        totalStocks: mockStocks.length,
        totalBonds: mockBonds.length,
        totalETFs: mockETFs.length,
        mutualFunds: mockMutualFunds.length,
        commodities: mockCommodities.length,
        sectors: sectors.length,
        gainers: gainers.length,
        losers: losers.length,
        topGainers: gainers.sort((a, b) => b.changePercent - a.changePercent).slice(0, 5).map(s => ({ symbol: s.symbol, name: s.name, changePercent: s.changePercent, price: s.price })),
        topLosers: losers.sort((a, b) => a.changePercent - b.changePercent).slice(0, 5).map(s => ({ symbol: s.symbol, name: s.name, changePercent: s.changePercent, price: s.price })),
    };

    return corsResponse(data, 200, origin);
}
