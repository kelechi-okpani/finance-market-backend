import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TradeRequest from "@/lib/models/TradeRequest";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/trades
 * List all stock buy/sell requests for admin review.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "pending";
        const type = searchParams.get("type"); // buy or sell

        const filter: any = { status };
        if (type) filter.type = type;

        const trades = await TradeRequest.find(filter)
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName email")
            .populate("portfolioId", "name");

        return corsResponse({ trades }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch trade requests", details: err.message }, 500, origin);
    }
}
