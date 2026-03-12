import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/transfers/pending
 * List all pending portfolio transfer requests for Admin approval.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Fetch all pending transfers and populate sender, recipient, and portfolio details
        const pendingTransfers = await PortfolioTransfer.find({ status: "pending" })
            .populate("senderId", "firstName lastName email avatar")
            .populate("recipientId", "firstName lastName email avatar")
            .populate("portfolioId", "name")
            .sort({ createdAt: -1 });

        return corsResponse({
            success: true,
            count: pendingTransfers.length,
            transfers: pendingTransfers
        }, 200, origin);

    } catch (error: any) {
        console.error("Fetch pending transfers error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
