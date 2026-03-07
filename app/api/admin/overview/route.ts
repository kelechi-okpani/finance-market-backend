import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import Stock from "@/lib/models/Stock";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/overview
 * Provides a high-level summary of the entire system state for the admin dashboard.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const [
            totalUsers,
            onboardingUsers,
            activeUsers,
            pendingKyc,
            pendingRequests,
            totalStocks
        ] = await Promise.all([
            User.countDocuments({ role: "user" }),
            User.countDocuments({ status: "onboarding" }),
            User.countDocuments({ accountStatus: "active" }),
            KYCDocument.countDocuments({ status: "pending" }),
            AccountRequest.countDocuments({ status: "pending" }),
            Stock.countDocuments({})
        ]);

        // Get latest 5 activities
        const [recentKycSubmissions, latestUsers] = await Promise.all([
            KYCDocument.find({ status: "pending" })
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate("userId", "firstName lastName email"),
            User.find({ role: "user" })
                .sort({ createdAt: -1 })
                .limit(5)
                .select("firstName lastName email status createdAt")
        ]);

        return corsResponse({
            stats: {
                totalUsers,
                onboardingUsers,
                activeUsers,
                pendingKyc,
                pendingRequests,
                totalStocks
            },
            recentKycSubmissions,
            latestUsers
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch overview", details: err.message }, 500, origin);
    }
}
