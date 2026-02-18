import { NextRequest } from "next/server";
import { searchStocks } from "@/lib/marketstack";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/search?q=... - Search for stock symbols
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return corsResponse({ error: "Search query must be at least 2 characters." }, 400, origin);
    }

    try {
        const results = await searchStocks(query);
        return corsResponse({ results }, 200, origin);
    } catch (error) {
        console.error("Market search API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
