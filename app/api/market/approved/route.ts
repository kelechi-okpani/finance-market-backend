import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/market/approved
 * Returns all stocks that have been approved (published) by the admin.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Fetch only published stocks
        const stocks = await Stock.find({ isPublished: true }).sort({ symbol: 1 }).lean();

        // Calculate some quick stats for the user
        const total = stocks.length;
        const gainers = stocks.filter(s => (s.change || 0) > 0).length;
        const losers = stocks.filter(s => (s.change || 0) < 0).length;
        const sectors = Array.from(new Set(stocks.map(s => s.sector))).filter(Boolean);
        const markets = Array.from(new Set(stocks.map(s => s.market))).filter(Boolean);

        return corsResponse({
            stocks,
            summary: {
                total,
                gainers,
                losers,
                sectors,
                markets
            }
        }, 200, origin);

    } catch (err: any) {
        console.error("Approved stocks API error:", err);
        return corsResponse({ error: "Failed to fetch approved stocks", details: err.message }, 500, origin);
    }
}
