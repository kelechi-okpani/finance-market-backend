import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import OnboardingProgress from "@/lib/models/OnboardingProgress";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import { hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let body: any = {};
        const contentType = request.headers.get("content-type") || "";

        // --- FIX 1: Parse the incoming data correctly ---
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            body = await request.json();
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
            partner,
            agreementAccepted,
            // --- FIX 2: Destructure the Cloudinary URLs sent from frontend ---
            frontPageUrl,
            backPageUrl,
            poaDocumentUrl,
            selfieUrl // if you're sending the selfie too

        } = body;

        // --- FIX 3: Re-enable validation ---
        if (!email || !password || !sex) {
            return corsResponse({ error: "Email, password, and sex are required." }, 400, origin);
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return corsResponse({ error: "No account found for this email." }, 404, origin);
        }

        const userId = user._id;
        const passwordHash = await hashPassword(password);

        // Update User Profile
        await User.findByIdAndUpdate(userId, {
            passwordHash,
            sex,
            country,
            address: `${houseNumber} ${street}, ${city}, ${state} ${zipCode}`,
            status: "pending",
            accountStatus: "pending",
            kycStatus: "pending",
            agreementSigned: agreementAccepted === "true" || agreementAccepted === true,
            agreementSignedAt: new Date(),
            onboardingStep: 5,
            // Save selfie if provided
            profileImage: selfieUrl || ""
        });

        // --- FIX 4: Save Cloudinary URLs to KYCDocument ---
        await KYCDocument.findOneAndUpdate(
            { userId },
            {
                documentType: idType,
                frontPageUrl: frontPageUrl ,
                backPageUrl: backPageUrl,
                status: "pending",

            },
            { upsert: true, new: true }
        );

        // --- FIX 5: Save Cloudinary URL to AddressVerification ---
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
                poaDocumentUrl: poaDocumentUrl,
                status: "pending",
            },
            { upsert: true, new: true }
        );

        // Update Progress Tracker
        await OnboardingProgress.findOneAndUpdate(
            { userId },
            {
                // $addToSet: { completedSteps: { $each: [7, 8, 9, 10, 11, 13, 14, 15] } },
                $set: {
                    currentStep: 16,
                    "data.gender": sex,
                    "data.kycDocumentId": idType,
                    "data.addressId": address._id.toString(),
                },
            },
            { upsert: true, new: true }
        );

        return corsResponse({ message: "KYC verification completed successfully.", kycStatus: "completed" }, 200, origin);

    } catch (err: any) {
        console.error("KYC onboarding error:", err);
        return corsResponse({ error: "Internal server error.", details: err.message }, 500, origin);
    }
}