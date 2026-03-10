import mongoose, { Schema, Document, Model } from "mongoose";

export type AccountType = "individual" | "joint" | "corporate" | "retirement" | "trust" | "personal";
export type KYCStatus = "not_started" | "pending" | "verified" | "rejected";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    sex?: "male" | "female";
    dateOfBirth?: string;
    occupation?: string;
    avatar?: string;
    address?: string;
    country?: string;
    role: "user" | "admin";
    status: "pending" | "approved" | "rejected" | "onboarding";
    accountStatus: "active" | "suspended" | "pending" | "rejected";
    accountCategory?: string; // assigned by admin on approval
    accountType?: AccountType;
    investorCode?: string;    // auto-generated 11-char code on approval, e.g. FS928892440
    kycStatus: KYCStatus;
    kycVerified: boolean;
    riskTolerance: "conservative" | "moderate" | "aggressive";
    baseCurrency: string;
    agreementSigned: boolean;
    agreementSignedAt?: Date;
    headshotUrl?: string;
    onboardingStep: number; // tracks the furthest completed step (7-15)
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    totalBalance: number;
    availableCash: number;
    failedWithdrawalAttempts: number;
    requiresResettlementAccount: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        sex: { type: String, enum: ["male", "female"] },
        dateOfBirth: { type: String },
        occupation: { type: String, trim: true },
        avatar: { type: String },
        address: { type: String, trim: true },
        country: { type: String, trim: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        status: { type: String, enum: ["pending", "approved", "rejected", "onboarding"], default: "pending" },
        accountStatus: { type: String, enum: ["active", "suspended", "pending", "rejected"], default: "pending" },
        accountCategory: { type: String },
        accountType: { type: String, enum: ["individual", "joint", "corporate", "retirement", "trust", "personal"], default: "individual" },
        investorCode: { type: String, unique: true, sparse: true },
        kycStatus: { type: String, enum: ["not_started", "pending", "verified", "rejected"], default: "not_started" },
        kycVerified: { type: Boolean, default: false },
        riskTolerance: { type: String, enum: ["conservative", "moderate", "aggressive"], default: "moderate" },
        baseCurrency: { type: String, default: "USD" },
        agreementSigned: { type: Boolean, default: false },
        agreementSignedAt: { type: Date },
        headshotUrl: { type: String },
        onboardingStep: { type: Number, default: 7 }, // step they are currently on
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        totalBalance: { type: Number, default: 0 },
        availableCash: { type: Number, default: 0 },
        failedWithdrawalAttempts: { type: Number, default: 0 },
        requiresResettlementAccount: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
