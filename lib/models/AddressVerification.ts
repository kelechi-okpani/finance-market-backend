import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * AddressVerification — Step 9
 * Stores user's residential address + proof of address document.
 */
export type PoADocumentType = "utility_bill" | "rent_receipt" | "water_bill";

export interface IAddressVerification extends Document {
    userId: mongoose.Types.ObjectId;
    houseNumber: string;
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
    countryFlag?: string;     // emoji or code e.g. "🇳🇬"
    poaDocumentType: PoADocumentType;
    poaDocumentUrl: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AddressVerificationSchema = new Schema<IAddressVerification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        houseNumber: { type: String, required: true, trim: true },
        streetAddress: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        stateProvince: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        countryFlag: { type: String },
        poaDocumentType: {
            type: String,
            enum: ["utility_bill", "rent_receipt", "water_bill"],
            required: true,
        },
        poaDocumentUrl: { type: String, required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        rejectionReason: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

const AddressVerification: Model<IAddressVerification> =
    mongoose.models.AddressVerification ||
    mongoose.model<IAddressVerification>("AddressVerification", AddressVerificationSchema);

export default AddressVerification;
