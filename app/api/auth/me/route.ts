import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const user = await getAuthUser(request);

        if (!user) {
            return corsResponse(
                { error: "Unauthorized. Please log in." },
                401,
                origin
            );
        }

        return corsResponse(
            {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                    sex: user.sex,
                    investorCode: user.investorCode,
                    accountCategory: user.accountCategory,
                    onboardingStep: user.onboardingStep,
                    headshotUrl: user.headshotUrl,
                    kycVerified: user.kycVerified,
                    agreementSigned: user.agreementSigned,
                    createdAt: user.createdAt,
                },
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Auth me error:", error);
        return corsResponse(
            { error: "Internal server error. Please try again later." },
            500,
            origin
        );
    }
}
