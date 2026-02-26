import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step13-14
 * Steps 13 & 14: Agreement & Signature
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { signatureType, signatureUrl } = body;

        if (!signatureType || !signatureUrl) {
            return corsResponse({ error: "Signature is required to proceed." }, 400, origin);
        }

        await connectDB();

        // Update User
        await User.findByIdAndUpdate(auth.user!._id, {
            agreementSigned: true,
            agreementSignedAt: new Date()
        });

        // Update Progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: [13, 14] },
                $set: {
                    currentStep: 15,
                    "data.agreementSigned": true,
                    "data.signatureType": signatureType,
                    "data.signatureUrl": signatureUrl
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Agreement signed and recorded.",
            nextStep: 15
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to process signature", details: err.message }, 500, origin);
    }
}
