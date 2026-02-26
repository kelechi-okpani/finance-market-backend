import { NextRequest } from "next/server";
import { mockStocks } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/stocks/[symbol] - Get a single stock detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const origin = request.headers.get("origin");
    const { symbol } = await params;

    const stock = mockStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());

    if (!stock) {
        return corsResponse({ error: `Stock '${symbol}' not found.` }, 404, origin);
    }

    return corsResponse({ stock }, 200, origin);
}
