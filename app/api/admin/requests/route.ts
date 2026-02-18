import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountRequest from "@/lib/models/AccountRequest";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/admin/requests - List all account requests
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // 'pending' | 'approved' | 'rejected'
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build filter
        const filter: Record<string, string> = {};
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }

        const [requests, total] = await Promise.all([
            AccountRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("reviewedBy", "firstName lastName email"),
            AccountRequest.countDocuments(filter),
        ]);

        return corsResponse(
            {
                requests,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Admin requests error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
