import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITradeRequest extends Document {
    userId: mongoose.Types.ObjectId;
    type: "buy" | "sell";
    symbol: string;
    name: string;
    industry?: string; 
    logo?: string;     
    currency: string;  
    shares: number;
    price: number;
    totalAmount: number;
    portfolioId: mongoose.Types.ObjectId;
    holdingId?: mongoose.Types.ObjectId;
    status: "pending" | "approved" | "rejected";

    // --- Live Market Snapshot (New Fields) ---
    marketPriceAtRequest: number; // mapping 'price'
    change: number;
    change_percent: number;
    marketCap: number;
    high: number;
    low: number;
    open: number;
    prev_close: number;
    isActive: boolean;
    lastUpdated: Date;
    
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
        name: { 
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
        price: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        totalAmount: { 
            type: Number, 
            required: true, 
            min: 0 
        },

        // --- Market Snapshot Fields ---
        marketPriceAtRequest: { type: Number }, 
        change: { type: Number },
        change_percent: { type: Number },
        marketCap: { type: Number },
        high: { type: Number },
        low: { type: Number },
        open: { type: Number },
        prev_close: { type: Number },
        isActive: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now },


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
    if (this.shares && this.price) {
        this.totalAmount = this.shares * this.price;
    }
    // next();
});

const TradeRequest: Model<ITradeRequest> = 
    mongoose.models.TradeRequest || mongoose.model<ITradeRequest>("TradeRequest", TradeRequestSchema);

export default TradeRequest;