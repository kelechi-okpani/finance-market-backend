import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * KYCDocument — Step 8: Identity Verification
 * Stores uploaded ID documents (passport, driver's license, etc.)
 * Supports per-document admin rejection with reason.
 */
export type KYCDocumentType = "passport" | "drivers_license" | "national_id" | "voters_id";
export type KYCDocumentStatus = "pending" | "approved" | "rejected";

export interface IKYCDocument extends Document {
    userId: mongoose.Types.ObjectId;
    documentType: KYCDocumentType;
    frontPageUrl: string;
    backPageUrl: string;
    status: KYCDocumentStatus;
    rejectionReason?: string;      // admin fills this when rejecting
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const KYCDocumentSchema = new Schema<IKYCDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        documentType: {
            type: String,
            enum: ["passport", "drivers_license", "national_id", "voters_id"],
            required: true,
        },
        frontPageUrl: { type: String, required: true },
        backPageUrl: { type: String, required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        rejectionReason: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

const KYCDocument: Model<IKYCDocument> =
    mongoose.models.KYCDocument || mongoose.model<IKYCDocument>("KYCDocument", KYCDocumentSchema);

export default KYCDocument;
