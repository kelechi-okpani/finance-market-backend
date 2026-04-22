import mongoose, { Schema, Document, Model } from "mongoose";


export interface IPortfolioAsset {
  // Core Identity
  symbol: string;
  name: string;
  logo: string;
  industry: string; 
  type: string; 
  shares: number;
  averagePrice: number; 
    price: number;
  totalCost: number;   
  currency: string;     
  change: number;         
  change_percent?: number;  
  marketCap: number;
  high: number;
  low: number;
  open: number;
  prev_close: number;
  addedAt: Date;
  lastUpdated: Date;
}

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  source?: string;
  status: 'active' | 'closed' | 'pending_transfer' | 'pending_claim';
  baseCurrency: string;

  assets: IPortfolioAsset[]; // MarketItems live here now
  totalValue: number;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    source: { type: String, trim: true },
    status: { type: String, enum: ['active', 'closed', 'pending_transfer', 'pending_claim'], default: 'active' },
    baseCurrency: { type: String, default: 'USD' },
    assets: [
      {
        symbol: { type: String, required: true, uppercase: true },
        name: { type: String, required: true },
        logo: { type: String },
        shares: { type: Number, required: true, min: 0 },
        averagePrice: { type: Number, required: true },
        totalCost: { type: Number },
        addedAt: { type: Date, default: Date.now },

        // --- Live Market Data Fields ---
        price: { type: Number , required: true},          // Current Market Price
        change: { type: Number , required: true},         // Price change (numerical)
        change_percent: { type: Number , required: true}, // Price change (percentage)
        industry: { type: String , required: true},
        marketCap: { type: Number , required: true},
        currency: { type: String, default: 'USD' },
        type: { type: String , required: true},           // e.g., 'stock', 'crypto'
        high: { type: Number , required: true},           // Daily high
        low: { type: Number , required: true},            // Daily low
        open: { type: Number , required: true},
        prev_close: { type: Number , required: true},
        isActive: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now },

      },
    ],
    totalValue: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate totalInvested before saving
PortfolioSchema.pre('save', function (next) {
  this.totalInvested = this.assets.reduce((sum, asset) => {
    asset.totalCost = asset.shares * asset.averagePrice;
    return sum + asset.totalCost;
  }, 0);
  // next();
});

const Portfolio: Model<IPortfolio> =
  mongoose.models.Portfolio || mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);

export default Portfolio;