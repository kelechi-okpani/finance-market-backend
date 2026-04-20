
import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem extends Document {
  userId: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId; // The specific portfolio for this trade
  
  type: "buy" | "sell";
  
  // Asset Identity (Mapped from MarketItem)
  symbol: string;
  companyName: string;
  logo: string;
  
  // Financial Data
  shares: number;
  pricePerShare: number; 
  totalAmount: number;   
  currency: string;
  
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
    companyName: { 
      type: String, 
      required: true 
    },
    logo: { type: String },
    shares: { 
      type: Number, 
      required: true, 
      min: [0.000001, "Shares must be greater than 0"] 
    },
    pricePerShare: { 
      type: Number, 
      required: true,
      min: [0, "Price cannot be negative"] 
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
  },
  { timestamps: true }
);

// Financial Logic: Auto-calculate totalAmount before validation
CartItemSchema.pre("validate", function (next) {
  if (this.shares && this.pricePerShare) {
    this.totalAmount = Number((this.shares * this.pricePerShare).toFixed(2));
  }
  // next();
});

// Compound index to prevent duplicate rows for the same stock in the same portfolio
CartItemSchema.index({ userId: 1, symbol: 1, type: 1, portfolioId: 1 }, { unique: true });

export default mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);


// import mongoose, { Schema, Document } from "mongoose";

// export interface ICartItem extends Document {
//   userId: mongoose.Types.ObjectId;
//   type: "buy" | "sell";
//   // Market Item Details
//   symbol: string;
//   companyName: string;
//   logo: string;
//   // Transaction Details
//   shares: number;
//   pricePerShare: number;
//   totalAmount: number;
//   currency: string;
//   // Relationships
//   portfolioId: mongoose.Types.ObjectId; // REQUIRED for both Buy & Sell
//   holdingId?: mongoose.Types.ObjectId;  // REQUIRED only for Sell
// }

// const CartItemSchema = new Schema<ICartItem>({
//   userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   type: { type: String, enum: ["buy", "sell"], required: true },
//   symbol: { type: String, required: true },
//   companyName: { type: String, required: true },
//   logo: { type: String },
//   shares: { type: Number, required: true, min: 0.00001 },
//   pricePerShare: { type: Number, required: true },
//   totalAmount: { type: Number, required: true },
//   currency: { type: String, default: "USD" },
//   portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true },
//   holdingId: { type: Schema.Types.ObjectId, ref: "Holding" }, // Populated when selling
// }, { timestamps: true });

// export default mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);