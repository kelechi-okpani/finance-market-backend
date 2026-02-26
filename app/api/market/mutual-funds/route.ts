import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import MutualFund from "@/lib/models/MutualFund";
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

    try {
        await connectDB();

        const filter: Record<string, any> = {};
        if (fundFamily) filter.fundFamily = { $regex: fundFamily, $options: "i" };
        if (fundType) filter.fundType = fundType;
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
            { managerName: { $regex: search, $options: "i" } },
        ];

        const funds = await MutualFund.find(filter).lean();
        const families = await MutualFund.distinct("fundFamily");

        return corsResponse({
            funds,
            total: funds.length,
            availableFamilies: families,
            availableTypes: ["index", "actively_managed", "balanced"],
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch mutual funds", details: err.message }, 500, origin);
    }
}
