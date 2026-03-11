import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITradeRequest extends Document {
    userId: mongoose.Types.ObjectId;
    type: "buy" | "sell";
    symbol: string;
    companyName: string;
    sector?: string;
    shares: number;
    pricePerShare: number;
    totalAmount: number;
    portfolioId: mongoose.Types.ObjectId;
    holdingId?: mongoose.Types.ObjectId; // for sell
    status: "pending" | "approved" | "rejected";
    adminRemarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TradeRequestSchema = new Schema<ITradeRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["buy", "sell"],
            required: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
        },
        companyName: {
            type: String,
            required: true,
        },
        sector: {
            type: String,
        },
        shares: {
            type: Number,
            required: true,
            min: 0,
        },
        pricePerShare: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        portfolioId: {
            type: Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true,
        },
        holdingId: {
            type: Schema.Types.ObjectId,
            ref: "Holding",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminRemarks: {
            type: String,
        },
    },
    { timestamps: true }
);

const TradeRequest: Model<ITradeRequest> =
    mongoose.models.TradeRequest || mongoose.model<ITradeRequest>("TradeRequest", TradeRequestSchema);

export default TradeRequest;
