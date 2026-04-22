import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioTransfer extends Document {
  portfolioId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  transferInstruction?: string;
  adminNotes?: string;
  assets: Array<{
    symbol: string;
    name: string;
    logo?: string;
    industry?: string;
    shares: number;
    averagePrice: number;
    price?: number;
    currency: string;
    totalValue: number;
  }>;
  totalAssets: number;
  totalShares: number;
  totalValue: number;
//   status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'awaiting_recipient_claim' | 'completed';
  resolvedAt?: Date;
  createdAt: Date;
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
    adminNotes: { type: String, trim: true },
    assets: [
      {
        symbol: { type: String, required: true, uppercase: true },
        name: { type: String, required: true },
        logo: { type: String },
        shares: { type: Number, required: true },
        averagePrice: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        totalValue: { type: Number, required: true },
      }
    ],
    totalAssets: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'awaiting_recipient_claim', 'completed'],
      default: 'pending',
      index: true,
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const PortfolioTransfer: Model<IPortfolioTransfer> =
  mongoose.models.PortfolioTransfer || 
  mongoose.model<IPortfolioTransfer>("PortfolioTransfer", PortfolioTransferSchema);

export default PortfolioTransfer;