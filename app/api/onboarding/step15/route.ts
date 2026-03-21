import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step15
 * Step 15: Selfie/Headshot Completion
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { headshotUrl } = body;

        if (!headshotUrl) {
            return corsResponse({ error: "Headshot photo is required to complete onboarding." }, 400, origin);
        }

        await connectDB();

        // 1. Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(headshotUrl, "onboarding/selfie");

        // 2. Mark onboarding as complete on user
        await User.findByIdAndUpdate(auth.user!._id, {
            headshotUrl: cloudinaryUrl,
            status: "pending", // Now waiting for admin review
            onboardingStep: 16 // 16 means fully completed onboarding
        });

        // Update final progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: 15 },
                $set: {
                    currentStep: 16,
                    "data.headshotUrl": cloudinaryUrl
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Onboarding completed! Your account is now under review.",
            status: "pending",
            redirectTo: "/dashboard"
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to complete onboarding", details: err.message }, 500, origin);
    }
}
