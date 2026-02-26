import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ETF from "@/lib/models/ETF";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/etfs?isIndexBased=true&search=vanguard
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const isIndexBased = searchParams.get("isIndexBased");
    const isActivelyManaged = searchParams.get("isActivelyManaged");
    const search = searchParams.get("search");

    try {
        await connectDB();

        const filter: Record<string, any> = {};
        if (isIndexBased !== null) filter.isIndexBased = isIndexBased === "true";
        if (isActivelyManaged !== null) filter.isActivelyManaged = isActivelyManaged === "true";
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
        ];

        const etfs = await ETF.find(filter).lean();

        return corsResponse({ etfs, total: etfs.length }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch ETFs", details: err.message }, 500, origin);
    }
}
