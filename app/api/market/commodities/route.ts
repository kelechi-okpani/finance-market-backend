import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Commodity from "@/lib/models/Commodity";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/commodities?type=precious_metal&trend=bullish&investmentType=etf
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const trend = searchParams.get("trend");
    const investmentType = searchParams.get("investmentType");
    const search = searchParams.get("search");

    try {
        await connectDB();

        const filter: Record<string, any> = {};
        if (type) filter.type = type;
        if (trend) filter.marketTrend = trend;
        if (investmentType) filter.investmentType = investmentType;
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
        ];

        const commodities = await Commodity.find(filter).lean();

        return corsResponse({
            commodities,
            total: commodities.length,
            availableTypes: ["precious_metal", "energy", "agricultural"],
            availableInvestmentTypes: ["physical", "etf", "futures"],
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch commodities", details: err.message }, 500, origin);
    }
}
