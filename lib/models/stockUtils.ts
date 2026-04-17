import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketItem extends Document {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  logo: string;
  industry: string;
  marketCap: number;
  currency: string;
  type: string;
  high: number;
  low: number;
  open: number;
  prev_close: number;
  isActive:boolean;
  lastUpdated: Date;
}

const MarketItemSchema: Schema = new Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String },
  price: { type: Number },
  change: { type: Number },
  change_percent: { type: Number },
  logo: { type: String },
  industry: { type: String },
  marketCap: { type: Number },
  currency: { type: String, default: 'USD' },
  type: { type: String },
  high: { type: Number },
  low: { type: Number },
  open: { type: Number },
  prev_close: { type: Number },
  isActive: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
});

// Update the lastUpdated field before saving
MarketItemSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
//   next();
});

export default mongoose.models.MarketItem || mongoose.model<IMarketItem>('MarketItem', MarketItemSchema);