import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step11-12
 * Steps 11 & 12: Fund Distribution & Settlement Account.
 * Handles both "Save" (simulates trouble per requirements) and "Do this later".
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { skip, partner, accountName, accountNumber, bankName, routingNumber, iban, swiftBic, bankAddress } = body;

        await connectDB();

        // If user clicks "Do this later"
        if (skip) {
            await OnboardingProgress.findOneAndUpdate(
                { userId: auth.user!._id },
                {
                    $addToSet: { completedSteps: [11, 12] },
                    $set: { currentStep: 13 }
                },
                { upsert: true }
            );
            return corsResponse({ message: "Skipped to step 13.", nextStep: 13 }, 200, origin);
        }

        // PER REQUIREMENT: "display this message below at each attempt: We are having trouble in recording this information. This doesn't appear to be the correct information required here."
        // We will return a 422 Unprocessable Entity with the specific message and a "do later" instruction.
        return corsResponse({
            error: "We are having trouble in recording this information. This doesn't appear to be the correct information required here.",
            advice: "We strongly advise that you 'Do this later' if you are not sure this information.",
            canDoLater: true
        }, 422, origin);

    } catch (err: any) {
        return corsResponse({ error: "Operation failed", details: err.message }, 500, origin);
    }
}
