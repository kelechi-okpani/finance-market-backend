import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/profile/kyc - Submit/verify KYC
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const user = auth.user!;
        user.kycVerified = true; // In a real app, this would involve document processing
        await user.save();

        return corsResponse({ message: "KYC verification successful.", user }, 200, origin);
    } catch (error) {
        console.error("KYC update error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
