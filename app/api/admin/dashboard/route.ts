import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountRequest from "@/lib/models/AccountRequest";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/admin/dashboard - Admin dashboard stats
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Require admin access
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Get counts
        const [pendingRequests, approvedRequests, rejectedRequests, totalUsers] =
            await Promise.all([
                AccountRequest.countDocuments({ status: "pending" }),
                AccountRequest.countDocuments({ status: "approved" }),
                AccountRequest.countDocuments({ status: "rejected" }),
                User.countDocuments(),
            ]);

        // Get recent pending requests
        const recentRequests = await AccountRequest.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("firstName lastName email createdAt");

        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("firstName lastName email role status createdAt");

        return corsResponse(
            {
                stats: {
                    pendingRequests,
                    approvedRequests,
                    rejectedRequests,
                    totalUsers,
                },
                recentRequests,
                recentUsers,
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Admin dashboard error:", error);
        return corsResponse(
            { error: "Internal server error." },
            500,
            origin
        );
    }
}
