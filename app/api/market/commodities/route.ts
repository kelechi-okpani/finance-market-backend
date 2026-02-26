import { NextRequest } from "next/server";
import { mockCommodities } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/commodities?type=precious_metal&trend=bullish
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const trend = searchParams.get("trend");
    const investmentType = searchParams.get("investmentType");
    const search = searchParams.get("search");

    let commodities = [...mockCommodities];

    if (type) commodities = commodities.filter(c => c.type === type);
    if (trend) commodities = commodities.filter(c => c.marketTrend === trend);
    if (investmentType) commodities = commodities.filter(c => c.investmentType === investmentType);
    if (search) commodities = commodities.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return corsResponse({
        commodities,
        total: commodities.length,
        availableTypes: ["precious_metal", "energy", "agricultural"],
        availableInvestmentTypes: ["physical", "etf", "futures"],
    }, 200, origin);
}
