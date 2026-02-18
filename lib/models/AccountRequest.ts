import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccountRequest extends Document {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message?: string;
    status: "pending" | "approved" | "rejected";
    reviewedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AccountRequestSchema = new Schema<IAccountRequest>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        message: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const AccountRequest: Model<IAccountRequest> =
    mongoose.models.AccountRequest ||
    mongoose.model<IAccountRequest>("AccountRequest", AccountRequestSchema);

export default AccountRequest;
