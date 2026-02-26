import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBond extends Document {
    symbol: string;
    issuer: string;
    type: "corporate" | "government" | "municipal" | "high_yield";
    couponRate: number;
    yieldToMaturity: number;
    maturityDate: string;
    creditRating: string;
    price: number;
    par: number;
    duration: number;
    change: number;
    changePercent: number;
    market: string;
}

const BondSchema = new Schema<IBond>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    issuer: { type: String, required: true },
    type: { type: String, enum: ["corporate", "government", "municipal", "high_yield"], required: true },
    couponRate: { type: Number, required: true },
    yieldToMaturity: { type: Number, required: true },
    maturityDate: { type: String, required: true },
    creditRating: { type: String, required: true },
    price: { type: Number, required: true },
    par: { type: Number, default: 100 },
    duration: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    market: { type: String, required: true },
}, { timestamps: true });

const Bond: Model<IBond> = mongoose.models.Bond || mongoose.model<IBond>("Bond", BondSchema);
export default Bond;
