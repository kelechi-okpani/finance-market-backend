import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TradeRequest from "@/lib/models/TradeRequest";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/trades/pending
 * List all pending buy and sell requests across all users.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Fetch all pending trades and populate user details
        const pendingTrades = await TradeRequest.find({ status: "pending" })
            .populate("userId", "firstName lastName email avatar availableCash")
            .populate("portfolioId", "name")
            .sort({ createdAt: -1 });

        return corsResponse({
            success: true,
            count: pendingTrades.length,
            trades: pendingTrades
        }, 200, origin);

    } catch (error: any) {
        console.error("Fetch pending trades error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
