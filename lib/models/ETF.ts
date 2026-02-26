import mongoose, { Schema, Document, Model } from "mongoose";

const ETFHoldingSchema = new Schema({
    symbol: String,
    name: String,
    percentage: Number,
}, { _id: false });

export interface IETF extends Document {
    symbol: string;
    name: string;
    indexName?: string;
    expenseRatio: number;
    nav: number;
    price: number;
    change: number;
    changePercent: number;
    aum: string;
    volume: string;
    yield?: number;
    isIndexBased: boolean;
    isActivelyManaged: boolean;
    holdings: { symbol: string; name: string; percentage: number }[];
    market: string;
    trackingError?: number;
}

const ETFSchema = new Schema<IETF>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    indexName: { type: String },
    expenseRatio: { type: Number, required: true },
    nav: { type: Number, required: true },
    price: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    aum: { type: String },
    volume: { type: String },
    yield: { type: Number },
    isIndexBased: { type: Boolean, default: false },
    isActivelyManaged: { type: Boolean, default: false },
    holdings: [ETFHoldingSchema],
    market: { type: String, required: true },
    trackingError: { type: Number },
}, { timestamps: true });

const ETF: Model<IETF> = mongoose.models.ETF || mongoose.model<IETF>("ETF", ETFSchema);
export default ETF;
