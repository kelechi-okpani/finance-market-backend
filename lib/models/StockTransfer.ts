import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * StockTransfer — Individual stock/share transfers between users.
 * Maps to frontend StockTransfer interface.
 */
export interface IStockTransfer extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId; // the user this transfer belongs to
    assetSymbol: string;
    assetName: string;
    shares: number;
    valueAtTransfer: number;
    fromUser: string;
    toUser: string;
    date: string;
    status: "completed" | "pending" | "rejected";
    type: "inbound" | "outbound";
    createdAt: Date;
    updatedAt: Date;
}

const StockTransferSchema = new Schema<IStockTransfer>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        assetSymbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        assetName: {
            type: String,
            required: true,
            trim: true,
        },
        shares: {
            type: Number,
            required: true,
            min: 0,
        },
        valueAtTransfer: {
            type: Number,
            required: true,
            min: 0,
        },
        fromUser: {
            type: String,
            required: true,
            trim: true,
        },
        toUser: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["completed", "pending", "rejected"],
            default: "pending",
        },
        type: {
            type: String,
            enum: ["inbound", "outbound"],
            required: true,
        },
    },
    { timestamps: true }
);

const StockTransfer: Model<IStockTransfer> =
    mongoose.models.StockTransfer ||
    mongoose.model<IStockTransfer>("StockTransfer", StockTransferSchema);

export default StockTransfer;
