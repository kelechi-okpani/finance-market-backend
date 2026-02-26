import { NextRequest } from "next/server";
import { mockMutualFunds } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/mutual-funds?fundFamily=Vanguard&fundType=index&search=growth
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const fundFamily = searchParams.get("fundFamily");
    const fundType = searchParams.get("fundType");
    const search = searchParams.get("search");

    let funds = [...mockMutualFunds];

    if (fundFamily) funds = funds.filter(f => f.fundFamily.toLowerCase() === fundFamily.toLowerCase());
    if (fundType) funds = funds.filter(f => f.fundType === fundType);
    if (search) funds = funds.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.symbol.toLowerCase().includes(search.toLowerCase()) ||
        f.managerName.toLowerCase().includes(search.toLowerCase())
    );

    return corsResponse({
        funds,
        total: funds.length,
        availableFamilies: [...new Set(mockMutualFunds.map(f => f.fundFamily))],
        availableTypes: ["index", "actively_managed", "balanced"],
    }, 200, origin);
}
