import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHolding extends Document {
    _id: mongoose.Types.ObjectId;
    portfolioId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    symbol: string;
    companyName: string;
    sector?: string;
    shares: number;
    avgBuyPrice: number;
    targetReturn?: number;
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
