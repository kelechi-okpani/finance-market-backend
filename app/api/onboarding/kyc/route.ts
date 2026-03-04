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
 *
 * Expected payload:
 * {
 *   email, password, sex, idType, country,
 *   houseNumber, street, city, state, zipCode,
 *   poaType,
 *   nomineeName: { first, middle, last },
 *   nomineeRelationship,
 *   nomineeAddressSame,
 *   partner,
 *   agreementAccepted
 * }
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const {
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
            nomineeName,
            nomineeRelationship,
            nomineeAddressSame,
            partner,
            agreementAccepted,
        } = body;

        // Validate required fields
        if (!password || !sex) {
            return corsResponse(
                { error: "Password and sex are required." },
                400,
                origin
            );
        }

        if (!idType) {
            return corsResponse(
                { error: "ID type is required for identity verification." },
                400,
                origin
            );
        }

        if (!country || !houseNumber || !street || !city || !state || !zipCode) {
            return corsResponse(
                { error: "Complete address information is required." },
                400,
                origin
            );
        }

        if (!nomineeName?.first || !nomineeName?.last || !nomineeRelationship) {
            return corsResponse(
                { error: "Nominee name (first and last) and relationship are required." },
                400,
                origin
            );
        }

        if (!agreementAccepted) {
            return corsResponse(
                { error: "You must accept the agreement to proceed." },
                400,
                origin
            );
        }

        await connectDB();

        const userId = auth.user!._id;

        // Step 7: Set password & sex
        const passwordHash = await hashPassword(password);
        await User.findByIdAndUpdate(userId, {
            passwordHash,
            sex,
            country,
            address: `${houseNumber} ${street}, ${city}, ${state} ${zipCode}`,
            status: "onboarding",
            kycStatus: "pending",
            agreementSigned: agreementAccepted,
            agreementSignedAt: agreementAccepted ? new Date() : undefined,
        });

        // Step 8: Store ID document type selection
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
                firstName: nomineeName.first,
                middleName: nomineeName.middle || "",
                lastName: nomineeName.last,
                relationship: nomineeRelationship,
                sameAddressAsUser: nomineeAddressSame ?? true,
            },
            { upsert: true, new: true }
        );

        // Step 11: Fund Distribution Partner
        // Stored in onboarding progress

        // Update onboarding progress for all completed steps
        await OnboardingProgress.findOneAndUpdate(
            { userId },
            {
                $addToSet: { completedSteps: { $each: [7, 8, 9, 10, 11, 13] } },
                $set: {
                    currentStep: agreementAccepted ? 14 : 13,
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

        // Update user's onboarding step
        await User.findByIdAndUpdate(userId, {
            onboardingStep: agreementAccepted ? 14 : 13,
        });

        return corsResponse(
            {
                message: "KYC onboarding completed successfully.",
                nextStep: agreementAccepted ? 14 : 13,
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
