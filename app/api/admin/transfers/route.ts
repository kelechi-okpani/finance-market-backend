import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/transfers
 * Retrieves all portfolio transfer requests (Pending, Accepted, Rejected).
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Fetch transfers with sender and portfolio details
        const transfers = await PortfolioTransfer.find()
            .populate("senderId", "firstName lastName email")
            .populate("portfolioId", "name")
            .sort({ createdAt: -1 });

        return corsResponse({ transfers }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Failed to fetch transfers." }, 500, origin);
    }
}