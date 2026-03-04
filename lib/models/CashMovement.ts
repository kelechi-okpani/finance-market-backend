import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * CashMovement — Deposit / Withdrawal records.
 * Maps to frontend CashMovement interface.
 */
export type CashMovementStatus = "completed" | "pending" | "failed" | "cancelled";

export interface ICashMovement extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: "deposit" | "withdrawal";
    amount: number;
    currency: string;
    method: string;
    status: CashMovementStatus;
    date: string;
    createdAt: Date;
    updatedAt: Date;
}

const CashMovementSchema = new Schema<ICashMovement>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["deposit", "withdrawal"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
            trim: true,
        },
        method: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["completed", "pending", "failed", "cancelled"],
            default: "pending",
        },
        date: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const CashMovement: Model<ICashMovement> =
    mongoose.models.CashMovement ||
    mongoose.model<ICashMovement>("CashMovement", CashMovementSchema);

export default CashMovement;
