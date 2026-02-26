import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Bond from "@/lib/models/Bond";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/bonds?type=government&search=treasury
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const search = searchParams.get("search");

    try {
        await connectDB();

        const filter: Record<string, any> = {};
        if (type) filter.type = type;
        if (search) filter.$or = [
            { issuer: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
        ];

        const bonds = await Bond.find(filter).lean();

        return corsResponse({
            bonds,
            total: bonds.length,
            availableTypes: ["government", "corporate", "municipal", "high_yield"],
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch bonds", details: err.message }, 500, origin);
    }
}
