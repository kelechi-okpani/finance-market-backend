import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioTransfer extends Document {
    portfolioId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    recipientId?: mongoose.Types.ObjectId;
    recipientEmail: string;
    recipientFirstName?: string;
    recipientLastName?: string;
    transferInstruction?: string;
    assets: Array<{
        symbol: string;
        shares: number;
        name: string;      // Changed from assetName to match PortfolioAsset
        averagePrice: number;
        totalValue: number;
    }>;
    totalAssets: number;
    totalShares: number;
    totalValue: number;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioTransferSchema = new Schema<IPortfolioTransfer>(
    {
        portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        recipientId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        recipientFirstName: { type: String, trim: true },
        recipientLastName: { type: String, trim: true },
        transferInstruction: { type: String, trim: true },
        assets: [
            {
                symbol: { type: String, required: true, uppercase: true },
                shares: { type: Number, required: true },
                name: { type: String, required: true },
                averagePrice: { type: Number, required: true },
                totalValue: { type: Number, required: true },
            }
        ],
        totalAssets: { type: Number, default: 0 },
        totalShares: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'cancelled'],
            default: 'pending',
            index: true,
        },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

PortfolioTransferSchema.index({ recipientEmail: 1, status: 1 });

const PortfolioTransfer: Model<IPortfolioTransfer> =
    mongoose.models.PortfolioTransfer || 
    mongoose.model<IPortfolioTransfer>("PortfolioTransfer", PortfolioTransferSchema);

export default PortfolioTransfer;