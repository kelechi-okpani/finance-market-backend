import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * AccountNominee — Step 10
 * Stores the account beneficiary/nominee for inheritance purposes.
 */
export type NomineeRelationship =
    | "father" | "mother" | "son" | "daughter" | "husband" | "wife"
    | "nephew" | "niece" | "uncle" | "aunty" | "school"
    | "non_profit" | "religious_organization" | "for_profit_legal_entity";

export interface IAccountNominee extends Document {
    userId: mongoose.Types.ObjectId;
    firstName: string;
    middleName?: string;
    lastName: string;
    relationship: NomineeRelationship;
    sameAddressAsUser: boolean;
    houseNumber?: string;
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    zipCode?: string;
    country?: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AccountNomineeSchema = new Schema<IAccountNominee>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        firstName: { type: String, required: true, trim: true },
        middleName: { type: String, trim: true },
        lastName: { type: String, required: true, trim: true },
        relationship: {
            type: String,
            enum: ["father", "mother", "son", "daughter", "husband", "wife",
                "nephew", "niece", "uncle", "aunty", "school",
                "non_profit", "religious_organization", "for_profit_legal_entity"],
            required: true,
        },
        sameAddressAsUser: { type: Boolean, default: false },
        // Only required if sameAddressAsUser is false
        houseNumber: { type: String, trim: true },
        streetAddress: { type: String, trim: true },
        city: { type: String, trim: true },
        stateProvince: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true },
        // Optional contact
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
    },
    { timestamps: true }
);

const AccountNominee: Model<IAccountNominee> =
    mongoose.models.AccountNominee ||
    mongoose.model<IAccountNominee>("AccountNominee", AccountNomineeSchema);

export default AccountNominee;
