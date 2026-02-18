import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'deposit' | 'withdrawal' | 'buy' | 'sell';
    amount: number;
    description?: string;
    referenceId?: string;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['deposit', 'withdrawal', 'buy', 'sell'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        referenceId: {
            type: String, // e.g. holdingId or bank ref
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
