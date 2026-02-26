import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommodity extends Document {
    symbol: string;
    name: string;
    type: "precious_metal" | "energy" | "agricultural";
    investmentType: "physical" | "etf" | "futures";
    spotPrice: number;
    change: number;
    changePercent: number;
    purity?: string;
    volume: string;
    currency: string;
    marketTrend?: "bullish" | "bearish" | "neutral";
}

const CommoditySchema = new Schema<ICommodity>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["precious_metal", "energy", "agricultural"], required: true },
    investmentType: { type: String, enum: ["physical", "etf", "futures"], required: true },
    spotPrice: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    purity: { type: String },
    volume: { type: String, default: "N/A" },
    currency: { type: String, default: "USD" },
    marketTrend: { type: String, enum: ["bullish", "bearish", "neutral"], default: "neutral" },
}, { timestamps: true });

const Commodity: Model<ICommodity> = mongoose.models.Commodity || mongoose.model<ICommodity>("Commodity", CommoditySchema);
export default Commodity;
