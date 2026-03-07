import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/kyc
 * Admin tool to get all users and their KYC/Onboarding status.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // onboarding status or accountStatus
        const role = searchParams.get("role");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (role) {
            filter.role = role;
        } else {
            // Default to users, but include ones without role if any exist
            filter.role = { $ne: "admin" };
        }

        if (status) {
            filter.accountStatus = status;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("firstName lastName email status accountStatus kycVerified onboardingStep createdAt updatedAt")
                .lean(),
            User.countDocuments(filter)
        ]);

        // For each user, fetch their documents
        const usersWithDocs = await Promise.all(users.map(async (user) => {
            const [kycDocs, addressDocs] = await Promise.all([
                KYCDocument.find({ userId: user._id }).lean(),
                AddressVerification.find({ userId: user._id }).lean()
            ]);
            return {
                ...user,
                documents: {
                    kyc: kycDocs,
                    address: addressDocs
                }
            };
        }));

        return corsResponse({
            users: usersWithDocs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, origin);

    } catch (err: any) {
        console.error("Admin KYC list error:", err);
        return corsResponse({ error: "Failed to fetch KYC data", details: err.message }, 500, origin);
    }
}
