import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/stocks/[symbol]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const origin = request.headers.get("origin");
    const { symbol } = await params;

    try {
        await connectDB();
        const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).lean();

        if (!stock) {
            return corsResponse({ error: `Stock '${symbol.toUpperCase()}' not found.` }, 404, origin);
        }

        return corsResponse({ stock }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch stock", details: err.message }, 500, origin);
    }
}
