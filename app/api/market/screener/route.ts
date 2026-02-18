import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/screener - Get market overview stats
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Simulation of screener counts as seen on the frontend
    const data = {
        totalStocks: 28,
        totalBonds: 8,
        totalETFs: 5,
        mutualFunds: 4,
        commodities: 9
    };

    return corsResponse(data, 200, origin);
}
