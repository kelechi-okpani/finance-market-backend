import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITradeRequest extends Document {
    userId: mongoose.Types.ObjectId;
    type: "buy" | "sell";
    symbol: string;
    companyName: string;
    industry?: string; 
    logo?: string;     
    currency: string;  
    shares: number;
    pricePerShare: number;
    totalAmount: number;
    portfolioId: mongoose.Types.ObjectId;
    holdingId?: mongoose.Types.ObjectId;
    status: "pending" | "approved" | "rejected";
    adminRemarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TradeRequestSchema = new Schema<ITradeRequest>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true, 
            index: true 
        },
        type: { 
            type: String, 
            enum: ["buy", "sell"], 
            required: true 
        },
        symbol: { 
            type: String, 
            required: true, 
            uppercase: true,
            trim: true 
        },
        companyName: { 
            type: String, 
            required: true,
            trim: true 
        },
        industry: { type: String },
        logo: { type: String },
        currency: { 
            type: String, 
            default: "USD",
            uppercase: true 
        },
        shares: { 
            type: Number, 
            required: true, 
            min: [0.000001, "Shares must be greater than 0"] 
        },
        pricePerShare: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        totalAmount: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        portfolioId: { 
            type: Schema.Types.ObjectId, 
            ref: "Portfolio", 
            required: true 
        },
        holdingId: { 
            type: Schema.Types.ObjectId, 
            ref: "Holding" 
        },
        status: { 
            type: String, 
            enum: ["pending", "approved", "rejected"], 
            default: "pending",
            index: true // Added index for fast admin filtering
        },
        adminRemarks: { type: String },
    },
    { timestamps: true }
);

// Virtual for calculating the subtotal if not provided
TradeRequestSchema.pre("save", function(next) {
    if (this.shares && this.pricePerShare) {
        this.totalAmount = this.shares * this.pricePerShare;
    }
    // next();
});

const TradeRequest: Model<ITradeRequest> = 
    mongoose.models.TradeRequest || mongoose.model<ITradeRequest>("TradeRequest", TradeRequestSchema);

export default TradeRequest;