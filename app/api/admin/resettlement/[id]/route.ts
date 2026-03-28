import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/resettlement/[id]
 * Get detailed info about a specific resettlement account for review.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();
        const account = await SettlementAccount.findById(id).populate("userId", "firstName lastName email");
        
        if (!account) return corsResponse({ error: "Resettlement account not found." }, 404, origin);
        
        return corsResponse({ account }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

/**
 * PUT /api/admin/resettlement/[id]
 * Update the status of a resettlement account (e.g., verify or fail).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!["pending_verification", "verified", "failed"].includes(status)) {
            return corsResponse({ error: "Invalid status. Must be 'pending_verification', 'verified', or 'failed'." }, 400, origin);
        }

        await connectDB();

        const account = await SettlementAccount.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("userId", "firstName lastName email");

        if (!account) return corsResponse({ error: "Resettlement account not found." }, 404, origin);

        return corsResponse({ 
            message: `Resettlement account status updated to ${status} successfully.`, 
            account 
        }, 200, origin);

    } catch (error) {
        console.error("Admin Resettlement PUT error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
