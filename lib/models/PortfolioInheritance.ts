import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioInheritance extends Document {
  _id: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId;
  originalOwnerId: mongoose.Types.ObjectId;
  beneficiaryId: mongoose.Types.ObjectId;
  legalDocumentUrl?: string; // Link to death certificate or legal proof
  inheritanceTaxPaid: boolean;
  status: 'pending' | 'verified' | 'completed' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const PortfolioInheritanceSchema = new Schema<IPortfolioInheritance>(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    originalOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    legalDocumentUrl: { type: String },
    inheritanceTaxPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'verified', 'completed', 'rejected'],
      default: 'pending',
    },
    adminNotes: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const PortfolioInheritance: Model<IPortfolioInheritance> =
  mongoose.models.PortfolioInheritance || 
  mongoose.model<IPortfolioInheritance>("PortfolioInheritance", PortfolioInheritanceSchema);

export default PortfolioInheritance;