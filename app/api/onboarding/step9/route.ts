import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AddressVerification from "@/lib/models/AddressVerification";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import { requireAuth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/step9
 * Step 9: Address Verification
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const {
            houseNumber, streetAddress, city, stateProvince, zipCode, country,
            poaDocumentType, poaDocumentUrl
        } = body;

        if (!houseNumber || !streetAddress || !city || !stateProvince || !zipCode || !country || !poaDocumentUrl) {
            return corsResponse({ error: "Missing required address fields or proof of address upload." }, 400, origin);
        }

        await connectDB();

        // 1. Upload proof of address to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(poaDocumentUrl, "onboarding/address");

        // 2. Save or update Address Verification
        const address = await AddressVerification.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                houseNumber, streetAddress, city, stateProvince, zipCode, country,
                poaDocumentType, poaDocumentUrl: cloudinaryUrl,
                status: "pending"
            },
            { upsert: true, new: true }
        );

        // Update progress
        await OnboardingProgress.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                $addToSet: { completedSteps: 9 },
                $set: {
                    currentStep: 10,
                    "data.addressId": address._id
                }
            },
            { upsert: true }
        );

        return corsResponse({
            message: "Step 9 completed successfully.",
            nextStep: 10
        }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to complete step 9", details: err.message }, 500, origin);
    }
}
