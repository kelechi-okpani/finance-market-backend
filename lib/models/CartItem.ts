import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem extends Document {
    userId: mongoose.Types.ObjectId;
    type: "buy" | "sell";
    symbol: string;
    companyName: string;
    shares: number;
    pricePerShare: number; // e.g. N1000
    totalAmount: number;    // pricePerShare * shares: e.g. N5000
    portfolioId?: mongoose.Types.ObjectId;
    holdingId?: mongoose.Types.ObjectId; // for sell
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
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
        shares: {
            type: Number,
            required: true,
            min: 0.00001,
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
        },
        holdingId: {
            type: Schema.Types.ObjectId,
            ref: "Holding",
        },
    },
    { timestamps: true }
);

const CartItem: Model<ICartItem> =
    mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);

export default CartItem;
