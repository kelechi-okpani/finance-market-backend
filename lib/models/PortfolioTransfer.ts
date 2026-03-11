import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioTransfer extends Document {
    _id: mongoose.Types.ObjectId;
    portfolioId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    recipientId?: mongoose.Types.ObjectId;
    recipientEmail: string;
    recipientFirstName?: string;
    recipientLastName?: string;
    recipientAddress?: string;
    recipientPhone?: string;
    transferInstruction?: string;
    // Accounting fields: snapshot of all assets
    assets: Array<{
        symbol: string;
        shares: number;
        avgBuyPrice: number;
        totalValue: number;
    }>;
    totalAssets: number;
    totalShares: number;
    totalValue: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    resolvedAt?: Date;
}

const PortfolioTransferSchema = new Schema<IPortfolioTransfer>(
    {
        portfolioId: {
            type: Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        recipientEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        recipientFirstName: { type: String, trim: true },
        recipientLastName: { type: String, trim: true },
        recipientAddress: { type: String, trim: true },
        recipientPhone: { type: String, trim: true },
        transferInstruction: { type: String, trim: true },
        assets: [
            {
                symbol: { type: String, required: true },
                shares: { type: Number, required: true },
                avgBuyPrice: { type: Number, required: true },
                totalValue: { type: Number, required: true },
            }
        ],
        totalAssets: { type: Number, default: 0 },
        totalShares: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const PortfolioTransfer: Model<IPortfolioTransfer> =
    mongoose.models.PortfolioTransfer ||
    mongoose.model<IPortfolioTransfer>("PortfolioTransfer", PortfolioTransferSchema);

export default PortfolioTransfer;
