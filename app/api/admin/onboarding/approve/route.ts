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
 * POST /api/admin/onboarding/approve
 * Final approval tool: Generates Investor Code and sets Account Category.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const { userId, category } = await request.json();

        if (!userId || !category) {
            return corsResponse({ error: "User ID and Account Category are required for approval." }, 400, origin);
        }

        await connectDB();

        // 1. Generate 11-digit Investor Code: FS + 9 random digits
        // Example: FS928892440
        const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
        const investorCode = `FS${randomDigits}`;

        // 2. Update User
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                status: "approved",
                kycVerified: true,
                accountCategory: category,
                investorCode: investorCode
            },
            { new: true }
        );

        // 3. Update all documents to approved
        await KYCDocument.updateMany({ userId }, { status: "approved" });
        await AddressVerification.updateMany({ userId }, { status: "approved" });

        return corsResponse({
            message: "User account approved successfully.",
            investorCode: updatedUser?.investorCode,
            category: updatedUser?.accountCategory,
            notification: "Welcome email and SMS with Investor Code have been queued." // simulated
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Approval failed", details: err.message }, 500, origin);
    }
}
