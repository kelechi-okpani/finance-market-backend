import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * ConnectedAccount — External linked accounts (bank, brokerage, etc.)
 * Maps to frontend ConnectedAccount interface.
 */
export interface IConnectedAccount extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    provider: string;
    accountName: string;
    lastFour: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

const ConnectedAccountSchema = new Schema<IConnectedAccount>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            trim: true,
        },
        accountName: {
            type: String,
            required: true,
            trim: true,
        },
        lastFour: {
            type: String,
            required: true,
            trim: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const ConnectedAccount: Model<IConnectedAccount> =
    mongoose.models.ConnectedAccount ||
    mongoose.model<IConnectedAccount>("ConnectedAccount", ConnectedAccountSchema);

export default ConnectedAccount;
