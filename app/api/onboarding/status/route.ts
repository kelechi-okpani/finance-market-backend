import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/onboarding/status
 * Returns the user's current onboarding progress and saved data.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        await connectDB();
        let progress = await OnboardingProgress.findOne({ userId: auth.user!._id });

        if (!progress) {
            // Initialize progress if it doesn't exist
            progress = await OnboardingProgress.create({
                userId: auth.user!._id,
                completedSteps: [],
                currentStep: 7,
                data: {}
            });
        }

        return corsResponse({ progress }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch onboarding status", details: err.message }, 500, origin);
    }
}
