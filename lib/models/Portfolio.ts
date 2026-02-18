import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolio extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: 'stocks' | 'bonds' | 'etfs' | 'mutual_funds' | 'gold';
    status: 'active' | 'closed';
    source: 'created' | 'transferred' | 'inherited';
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['stocks', 'bonds', 'etfs', 'mutual_funds', 'gold'],
            default: 'stocks',
        },
        status: {
            type: String,
            enum: ['active', 'closed'],
            default: 'active',
        },
        source: {
            type: String,
            enum: ['created', 'transferred', 'inherited'],
            default: 'created',
        },
    },
    {
        timestamps: true,
    }
);

const Portfolio: Model<IPortfolio> =
    mongoose.models.Portfolio || mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);

export default Portfolio;
