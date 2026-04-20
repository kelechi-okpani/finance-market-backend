import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  portfolioId?: mongoose.Types.ObjectId; // Critical for tracking where money moved
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'transfer';
  amount: number;
  symbol?: string;        // Added for trade tracking
  shares?: number;        // Added for trade tracking
  pricePerShare?: number; // Added for trade tracking
  currency: string;
  description?: string;
  referenceId?: string;   // e.g., tradeRequestId or bank transfer ref
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'buy', 'sell', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    symbol: { type: String, uppercase: true },
    shares: { type: Number },
    pricePerShare: { type: Number },
    currency: { type: String, default: 'USD' },
    description: { type: String, trim: true },
    referenceId: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'completed' 
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Transactions shouldn't change
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;