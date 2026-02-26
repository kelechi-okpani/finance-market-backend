import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * SettlementAccount — Step 12: Redemption & Settlement Account
 * Stores the user's bank / redemption account details.
 * Region-specific: USA uses Routing (ABA), Europe uses IBAN, Asia uses SWIFT/BIC.
 */
export interface ISettlementAccount extends Document {
    userId: mongoose.Types.ObjectId;
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankAddress?: string;
    // Region-specific fields
    routingNumber?: string;   // USA
    iban?: string;            // Europe
    swiftBic?: string;        // Asia
    currency?: string;
    fundDistributionPartner?: string; // from Step 11
    status: "pending_verification" | "verified" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

const SettlementAccountSchema = new Schema<ISettlementAccount>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        accountName: { type: String, required: true, trim: true },
        accountNumber: { type: String, required: true, trim: true },
        bankName: { type: String, required: true, trim: true },
        bankAddress: { type: String, trim: true },
        routingNumber: { type: String, trim: true },
        iban: { type: String, trim: true },
        swiftBic: { type: String, trim: true },
        currency: { type: String, default: "USD" },
        fundDistributionPartner: { type: String, trim: true },
        status: {
            type: String,
            enum: ["pending_verification", "verified", "failed"],
            default: "pending_verification",
        },
    },
    { timestamps: true }
);

const SettlementAccount: Model<ISettlementAccount> =
    mongoose.models.SettlementAccount ||
    mongoose.model<ISettlementAccount>("SettlementAccount", SettlementAccountSchema);

export default SettlementAccount;
