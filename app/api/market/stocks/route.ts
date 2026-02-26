import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/stocks?sector=Technology&market=NASDAQ&trend=bullish&search=apple&limit=50
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const sector = searchParams.get("sector");
    const market = searchParams.get("market");
    const trend = searchParams.get("trend");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
        await connectDB();

        // Build dynamic MongoDB filter
        const filter: Record<string, any> = {};
        if (sector) filter.sector = { $regex: sector, $options: "i" };
        if (market) filter.market = { $regex: market, $options: "i" };
        if (trend) filter.marketTrend = trend;
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
        ];

        const stocks = await Stock.find(filter).limit(limit).lean();
        const total = await Stock.countDocuments(filter);
        const gainers = await Stock.countDocuments({ change: { $gt: 0 } });
        const losers = await Stock.countDocuments({ change: { $lt: 0 } });
        const sectors = await Stock.distinct("sector");

        return corsResponse({
            stocks,
            total,
            stats: { gainers, losers, sectors: sectors.length },
            availableSectors: sectors,
            availableMarkets: await Stock.distinct("market"),
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch stocks", details: err.message }, 500, origin);
    }
}
