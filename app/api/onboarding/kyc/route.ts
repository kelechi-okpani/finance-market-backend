import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import AccountNominee from "@/lib/models/AccountNominee";
import { requireAuth, hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/onboarding/kyc
 * Unified KYC Onboarding — accepts the full KYC form data in one request.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let body: any = {};
        const contentType = request.headers.get("content-type") || "";

        try {
            if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
                const formData = await request.formData();
                body = Object.fromEntries(formData.entries());

                // Construct nomineeName from flat form data if sent that way
                body.nomineeName = {
                    first: body.nomineeFirstName || body["nomineeName.first"] || body["nomineeName[first]"] || "",
                    middle: body.nomineeMiddleName || body["nomineeName.middle"] || body["nomineeName[middle]"] || "",
                    last: body.nomineeLastName || body["nomineeName.last"] || body["nomineeName[last]"] || "",
                };

                // Parse checkbox/string booleans
                body.agreementAccepted = body.agreementAccepted === "true" || body.agreementAccepted === "on" || body.agreementAccepted === true;
                body.nomineeAddressSame = body.nomineeAddressSame !== "false" && body.nomineeAddressSame !== false;

            } else {
                body = await request.json();
            }
        } catch (parseError: any) {
            return corsResponse({ error: "Invalid request format. Expected JSON or Form Data.", details: parseError.message }, 400, origin);
        }

        const {
            email,
            password,
            sex,
            idType,
            country,
            houseNumber,
            street,
            city,
            state,
            zipCode,
            poaType,
            nomineeName = {},
            nomineeRelationship,
            nomineeAddressSame,
            partner,
            agreementAccepted,
        } = body;

        // Validate required fields
        if (!email || !password || !sex) {
            return corsResponse({ error: "Email, password, and sex are required." }, 400, origin);
        }

        await connectDB();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return corsResponse({ error: "No account request found for this email. Please request an account first." }, 404, origin);
        }

        // Only allow KYC if the account is approved (awaiting onboarding) or already in onboarding
        if (user.status === "pending" || user.status === "rejected") {
            return corsResponse({ error: "Your account request is still pending or has been rejected. Please contact support." }, 403, origin);
        }

        if (user.kycVerified && user.accountStatus === "active") {
            return corsResponse({ error: "Your KYC is already verified and your account is active." }, 400, origin);
        }

        // Validate idType separately now that we removed the unified validation block
        if (!idType) {
            return corsResponse({ error: "Identity document type is required." }, 400, origin);
        }

        const userId = user._id;

        // Step 7-15: Unified Update
        const passwordHash = await hashPassword(password);
        await User.findByIdAndUpdate(userId, {
            passwordHash,
            sex,
            country,
            address: `${houseNumber} ${street}, ${city}, ${state} ${zipCode}`,
            status: "onboarding",
            accountStatus: "pending",
            kycStatus: "pending",
            agreementSigned: agreementAccepted,
            agreementSignedAt: agreementAccepted ? new Date() : undefined,
            onboardingStep: 16 // 16 means KYC data submitted
        });

        // Step 8: Identity document selection
        await KYCDocument.findOneAndUpdate(
            { userId },
            {
                documentType: idType,
                frontPageUrl: "pending_upload",
                backPageUrl: "pending_upload",
                status: "pending",
            },
            { upsert: true, new: true }
        );

        // Step 9: Address Verification
        const address = await AddressVerification.findOneAndUpdate(
            { userId },
            {
                houseNumber,
                streetAddress: street,
                city,
                stateProvince: state,
                zipCode,
                country,
                poaDocumentType: poaType || "utility_bill",
                poaDocumentUrl: "pending_upload",
                status: "pending",
            },
            { upsert: true, new: true }
        );

        // Step 10: Account Nominee
        const nominee = await AccountNominee.findOneAndUpdate(
            { userId },
            {
                firstName: nomineeName.first || "",
                middleName: nomineeName.middle || "",
                lastName: nomineeName.last || "",
                relationship: nomineeRelationship || "",
                sameAddressAsUser: nomineeAddressSame ?? true,
            },
            { upsert: true, new: true }
        );

        // Update onboarding progress
        await OnboardingProgress.findOneAndUpdate(
            { userId },
            {
                $addToSet: { completedSteps: { $each: [7, 8, 9, 10, 11, 13, 14, 15] } },
                $set: {
                    currentStep: 16,
                    "data.password": true,
                    "data.gender": sex,
                    "data.kycDocumentId": idType,
                    "data.addressId": address._id.toString(),
                    "data.nomineeId": nominee._id.toString(),
                    "data.fundDistributionPartner": partner || "",
                    "data.agreementSigned": agreementAccepted,
                },
            },
            { upsert: true, new: true }
        );

        return corsResponse(
            {
                message: "KYC onboarding completed successfully.",
                nextStep: 16,
                kycStatus: "pending",
            },
            200,
            origin
        );
    } catch (err: any) {
        console.error("KYC onboarding error:", err);
        return corsResponse(
            { error: "Failed to complete KYC onboarding.", details: err.message },
            500,
            origin
        );
    }
}
