import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/resettlement
 * List all resettlement accounts for the platform (for admin oversight).
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "pending_verification";

        await connectDB();

        const query = status === "all" ? {} : { status };
        const accounts = await SettlementAccount.find(query)
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 });

        return corsResponse({
            count: accounts.length,
            accounts
        }, 200, origin);

    } catch (error) {
        console.error("Admin Resettlement GET error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
