import mongoose, { Schema, Document, Model } from "mongoose";

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
    role: "user" | "admin";
    status: "pending" | "approved" | "rejected" | "onboarding";
    accountCategory?: string; // assigned by admin on approval
    investorCode?: string;    // auto-generated 11-char code on approval, e.g. FS928892440
    kycVerified: boolean;
    agreementSigned: boolean;
    agreementSignedAt?: Date;
    headshotUrl?: string;
    onboardingStep: number; // tracks the furthest completed step (7-15)
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        sex: { type: String, enum: ["male", "female"] },
        dateOfBirth: { type: String },
        occupation: { type: String, trim: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        status: { type: String, enum: ["pending", "approved", "rejected", "onboarding"], default: "pending" },
        accountCategory: { type: String },
        investorCode: { type: String, unique: true, sparse: true },
        kycVerified: { type: Boolean, default: false },
        agreementSigned: { type: Boolean, default: false },
        agreementSignedAt: { type: Date },
        headshotUrl: { type: String },
        onboardingStep: { type: Number, default: 7 }, // step they are currently on
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
