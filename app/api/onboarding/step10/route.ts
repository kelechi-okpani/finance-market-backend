import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountNominee from "@/lib/models/AccountNominee";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step10
 * Step 10: Account Nominee
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const {
            firstName, middleName, lastName, relationship, sameAddressAsUser,
            houseNumber, streetAddress, city, stateProvince, zipCode, country,
            email, phone
        } = body;

        if (!firstName || !lastName || !relationship) {
            return corsResponse({ error: "Nominee name and relationship are required." }, 400, origin);
        }

        await connectDB();

        // Save or update Nominee
        const nominee = await AccountNominee.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                firstName, middleName, lastName, relationship, sameAddressAsUser,
                houseNumber, streetAddress, city, stateProvince, zipCode, country,
                email, phone
            },
            { upsert: true, new: true }
        );

        // Update progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: 10 },
                $set: {
                    currentStep: 11,
                    "data.nomineeId": nominee._id
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Step 10 completed successfully.",
            nextStep: 11
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to complete step 10", details: err.message }, 500, origin);
    }
}
