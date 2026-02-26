import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import KYCDocument from "@/lib/models/KYCDocument";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step8
 * Step 8: Identity Verification (Upload ID)
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { documentType, frontPageUrl, backPageUrl } = body;

        if (!documentType || !frontPageUrl || !backPageUrl) {
            return corsResponse({ error: "Document type and both front/back page uploads are required." }, 400, origin);
        }

        await connectDB();

        // Save or update KYC document
        const kycDoc = await KYCDocument.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                documentType,
                frontPageUrl,
                backPageUrl,
                status: "pending"
            },
            { upsert: true, new: true }
        );

        // Update progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: 8 },
                $set: {
                    currentStep: 9,
                    "data.kycDocumentId": kycDoc._id
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Step 8 completed successfully.",
            nextStep: 9
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to complete step 8", details: err.message }, 500, origin);
    }
}
