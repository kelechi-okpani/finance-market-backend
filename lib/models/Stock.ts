import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStock extends Document {
    symbol: string;
    name: string;
    market: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    marketCap: string;
    sector: string;
    peRatio?: number;
    dividend?: number;
    marketTrend?: "bullish" | "bearish" | "neutral";
    description?: string;
    isPublished: boolean;
}

const StockSchema = new Schema<IStock>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    market: { type: String, required: true },
    price: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    volume: { type: String, default: "N/A" },
    marketCap: { type: String, default: "N/A" },
    sector: { type: String, required: true },
    peRatio: { type: Number },
    dividend: { type: Number },
    marketTrend: { type: String, enum: ["bullish", "bearish", "neutral"], default: "neutral" },
    description: { type: String },
    isPublished: { type: Boolean, default: false },
}, { timestamps: true });

const Stock: Model<IStock> = mongoose.models.Stock || mongoose.model<IStock>("Stock", StockSchema);
export default Stock;
