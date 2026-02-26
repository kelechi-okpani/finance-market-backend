import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * OnboardingProgress
 * Tracks the user's journey through the onboarding steps.
 * Auto-saved after each step — users never restart completed steps.
 */
export interface IOnboardingProgress extends Document {
    userId: mongoose.Types.ObjectId;
    completedSteps: number[];  // e.g. [7, 8, 9]
    currentStep: number;
    data: {
        password?: boolean;          // Step 7: password set
        gender?: string;             // Step 7: sex
        kycDocumentId?: string;      // Step 8: id verification
        addressId?: string;          // Step 9: address verification
        nomineeId?: string;          // Step 10: nominee
        fundDistributionPartner?: string; // Step 11
        settlementAccountId?: string; // Step 12
        agreementSigned?: boolean;   // Step 13
        signatureType?: "typed" | "drawn" | "uploaded"; // Step 14
        signatureUrl?: string;
        headshotUrl?: string;        // Step 15
    };
    createdAt: Date;
    updatedAt: Date;
}

const OnboardingProgressSchema = new Schema<IOnboardingProgress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        completedSteps: [{ type: Number }],
        currentStep: { type: Number, default: 7 },
        data: {
            password: Boolean,
            gender: String,
            kycDocumentId: String,
            addressId: String,
            nomineeId: String,
            fundDistributionPartner: String,
            settlementAccountId: String,
            agreementSigned: Boolean,
            signatureType: { type: String, enum: ["typed", "drawn", "uploaded"] },
            signatureUrl: String,
            headshotUrl: String,
        },
    },
    { timestamps: true }
);

const OnboardingProgress: Model<IOnboardingProgress> =
    mongoose.models.OnboardingProgress ||
    mongoose.model<IOnboardingProgress>("OnboardingProgress", OnboardingProgressSchema);

export default OnboardingProgress;
