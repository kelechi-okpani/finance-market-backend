import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioInheritance from "@/lib/models/PortfolioInheritance";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/inheritance
 * List all inheritance requests for admin review.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const requests = await PortfolioInheritance.find()
            .populate("originalOwnerId", "firstName lastName email")
            .populate("beneficiaryId", "firstName lastName email")
            .populate("portfolioId", "name")
            .sort({ createdAt: -1 });

        return corsResponse({ requests }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Failed to fetch inheritance requests." }, 500, origin);
    }
}