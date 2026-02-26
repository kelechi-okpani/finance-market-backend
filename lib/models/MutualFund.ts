import mongoose, { Schema, Document, Model } from "mongoose";

const MutualFundHoldingSchema = new Schema({
    symbol: String,
    name: String,
    percentage: Number,
}, { _id: false });

export interface IMutualFund extends Document {
    symbol: string;
    name: string;
    fundFamily: string;
    fundType: "index" | "actively_managed" | "balanced";
    expenseRatio: number;
    nav: number;
    price: number;
    change: number;
    changePercent: number;
    minimumInvestment: number;
    aum: string;
    yield?: number;
    managerName: string;
    managerTenure: number;
    performance1Y: number;
    performance3Y: number;
    performance5Y: number;
    holdings: { symbol: string; name: string; percentage: number }[];
    market: string;
}

const MutualFundSchema = new Schema<IMutualFund>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    fundFamily: { type: String, required: true },
    fundType: { type: String, enum: ["index", "actively_managed", "balanced"], required: true },
    expenseRatio: { type: Number, required: true },
    nav: { type: Number, required: true },
    price: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    minimumInvestment: { type: Number, default: 0 },
    aum: { type: String },
    yield: { type: Number },
    managerName: { type: String },
    managerTenure: { type: Number },
    performance1Y: { type: Number, default: 0 },
    performance3Y: { type: Number, default: 0 },
    performance5Y: { type: Number, default: 0 },
    holdings: [MutualFundHoldingSchema],
    market: { type: String, required: true },
}, { timestamps: true });

const MutualFund: Model<IMutualFund> = mongoose.models.MutualFund || mongoose.model<IMutualFund>("MutualFund", MutualFundSchema);
export default MutualFund;
