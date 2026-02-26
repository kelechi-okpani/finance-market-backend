import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import bcrypt from "bcryptjs";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step7
 * Step 7: Create Password & Select Sex.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { password, sex } = body;

        if (!password || !sex) {
            return corsResponse({ error: "Password and Sex are required." }, 400, origin);
        }

        await connectDB();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update user
        await User.findByIdAndUpdate(auth.user!._id, {
            passwordHash,
            sex,
            status: "onboarding"
        });

        // Update progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: 7 },
                $set: {
                    currentStep: 8,
                    "data.password": true,
                    "data.gender": sex
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Step 7 completed successfully.",
            nextStep: 8
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to complete step 7", details: err.message }, 500, origin);
    }
}
