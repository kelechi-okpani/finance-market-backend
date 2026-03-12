import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHolding extends Document {
    _id: mongoose.Types.ObjectId;
    portfolioId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    symbol: string;
    name: string; // was companyName
    companyName: string; // maintain for compatibility
    sector?: string;
    shares: number;
    avgBuyPrice: number;
    targetReturn?: number;
    // Market snapshotted fields
    market?: string;
    price?: number;
    change?: number;
    changePercent?: number;
    volume?: string;
    marketCap?: string;
    peRatio?: number;
    dividend?: number;
    marketTrend?: "bullish" | "bearish" | "neutral";
    description?: string;
    boughtAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
    {
        portfolioId: {
            type: Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        name: { // Add name field for stock parity
            type: String,
            trim: true,
        },
        sector: {
            type: String,
            trim: true,
        },
        shares: {
            type: Number,
            required: true,
            min: 0,
        },
        avgBuyPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        // Snapshot fields
        market: { type: String },
        price: { type: Number },
        change: { type: Number },
        changePercent: { type: Number },
        volume: { type: String },
        marketCap: { type: String },
        peRatio: { type: Number },
        dividend: { type: Number },
        marketTrend: { type: String, enum: ["bullish", "bearish", "neutral"] },
        description: { type: String },
        targetReturn: {
            type: Number,
        },
        boughtAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Holding: Model<IHolding> =
    mongoose.models.Holding || mongoose.model<IHolding>("Holding", HoldingSchema);

export default Holding;
