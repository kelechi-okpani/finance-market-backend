import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioTransfer extends Document {
    _id: mongoose.Types.ObjectId;
    portfolioId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    recipientId?: mongoose.Types.ObjectId;
    recipientEmail: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    phone?: string;
    description?: string;
    // Accounting fields
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
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        address: { type: String, trim: true },
        phone: { type: String, trim: true },
        description: { type: String, trim: true },
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
