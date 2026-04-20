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
 * Fetches all user trade requests with advanced filtering and pagination.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        
        // 1. Extract Query Parameters
        const status = searchParams.get("status"); // e.g., 'pending', 'approved', 'rejected'
        const type = searchParams.get("type");     // 'buy' or 'sell'
        const symbol = searchParams.get("symbol"); // Filter by specific stock
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // 2. Build Dynamic Filter
        const filter: any = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (symbol) filter.symbol = symbol.toUpperCase();

        // 3. Execute Query with Population
        // We populate userId and portfolioId to show the Admin WHO is trading and WHERE.
        const [trades, total] = await Promise.all([
            TradeRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "firstName lastName email avatar status")
                .populate("portfolioId", "name type")
                .lean(), // lean() improves performance for read-only admin queries
            TradeRequest.countDocuments(filter)
        ]);

        return corsResponse({ 
            trades, 
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        }, 200, origin);

    } catch (err: any) {
        console.error("Admin Trade Fetch Error:", err);
        return corsResponse({ 
            error: "Failed to fetch trade requests", 
            details: err.message 
        }, 500, origin);
    }
}