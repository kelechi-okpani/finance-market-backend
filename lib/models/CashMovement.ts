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
    description?: string; // Add this so TypeScript knows it exists
    date: string;         // Kept as string to match your current schema
    settlementAccountId?: mongoose.Types.ObjectId;
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
        // --- ADDED/FIXED FIELDS ---
        description: { 
            type: String 
        }, 
        date: { 
            type: String, 
            default: () => new Date().toISOString() // Use a function to ensure a string is returned
        },
        // ---------------------------
        settlementAccountId: {
            type: Schema.Types.ObjectId,
            ref: "SettlementAccount",
        },
    },
    { timestamps: true }
);

const CashMovement: Model<ICashMovement> =
    mongoose.models.CashMovement ||
    mongoose.model<ICashMovement>("CashMovement", CashMovementSchema);

export default CashMovement;