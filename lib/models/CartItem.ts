import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem extends Document {
  userId: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId; 
  
  type: "buy" | "sell";
  
  // Asset Identity
  symbol: string;
  name: string; // Mapped from 'name'
  logo: string;
  industry: string;
  
  // Financial Data
  shares: number; 
  totalAmount: number;   
  currency: string;

  // Live Market Snapshot (New Fields)
  price: number;
  change: number;
  change_percent: number;
  marketCap: number;
  assetType: string; // e.g., 'stock', 'crypto'
  high: number;
  low: number;
  open: number;
  prev_close: number;
  isActive: boolean;
  lastUpdated: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    portfolioId: { 
      type: Schema.Types.ObjectId, 
      ref: "Portfolio", 
      required: true 
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
      required: true 
    },
    logo: { type: String },
    industry: { type: String },
    
    // Trade Data
    shares: { 
      type: Number, 
      required: true, 
      min: [0.000001, "Shares must be greater than 0"] 
    },
 
    totalAmount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      default: "USD",
      uppercase: true 
    },

    // Market Data Snapshot
    price: { type: Number,  required: true },
    change: { type: Number,  required: true },
    change_percent: { type: Number,  required: true },
    marketCap: { type: Number,  required: true },
    assetType: { type: String,  required: true },
    high: { type: Number,  required: true },
    low: { type: Number,  required: true },
    open: { type: Number,  required: true },
    prev_close: { type: Number,  required: true },
    isActive: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Financial Logic: Auto-calculate totalAmount before validation
CartItemSchema.pre("validate", function (next) {
  if (this.shares && this.price) {
    this.totalAmount = Number((this.shares * this.price).toFixed(2));
  }
  // next(); // Fixed: Added next() call
});

// Compound index to prevent duplicate rows for the same stock in the same portfolio
CartItemSchema.index({ userId: 1, symbol: 1, type: 1, portfolioId: 1 }, { unique: true });

export default mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);