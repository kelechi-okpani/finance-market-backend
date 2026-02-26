/**
 * SEED SCRIPT
 * Populates MongoDB with mock data from the dataset files.
 * 
 * Run: npx tsx scripts/seed.ts
 * 
 * This script is idempotent — safe to run multiple times.
 * It uses upsert so it won't create duplicate documents.
 */

// Load env FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Handle both ESM and CJS contexts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

const result = config({ path: envPath });
if (result.error) {
    // Try current working directory
    config({ path: resolve(process.cwd(), ".env.local") });
}

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found. Make sure .env.local exists with MONGODB_URI set.");
    process.exit(1);
}

console.log("🌱 Connecting to MongoDB...");
console.log("   URI:", MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ":****@")); // mask password

// ─── SCHEMAS ────────────────────────────────────────────────────────────────

const etfHoldingSchema = new mongoose.Schema({ symbol: String, name: String, percentage: Number }, { _id: false });
const mfHoldingSchema = new mongoose.Schema({ symbol: String, name: String, percentage: Number }, { _id: false });

const StockModel = mongoose.model("Stock", new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    name: String, market: String, price: Number, change: Number,
    changePercent: Number, volume: String, marketCap: String,
    sector: String, marketTrend: String,
}, { timestamps: true }));

const BondModel = mongoose.model("Bond", new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    issuer: String, type: String, couponRate: Number,
    yieldToMaturity: Number, maturityDate: String, creditRating: String,
    price: Number, par: Number, duration: Number, change: Number,
    changePercent: Number, market: String,
}, { timestamps: true }));

const ETFModel = mongoose.model("ETF", new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    name: String, indexName: String, expenseRatio: Number, nav: Number,
    price: Number, change: Number, changePercent: Number, aum: String,
    volume: String, yield: Number, isIndexBased: Boolean,
    isActivelyManaged: Boolean, holdings: [etfHoldingSchema],
    market: String, trackingError: Number,
}, { timestamps: true }));

const MutualFundModel = mongoose.model("MutualFund", new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    name: String, fundFamily: String, fundType: String,
    expenseRatio: Number, nav: Number, price: Number, change: Number,
    changePercent: Number, minimumInvestment: Number, aum: String,
    yield: Number, managerName: String, managerTenure: Number,
    performance1Y: Number, performance3Y: Number, performance5Y: Number,
    holdings: [mfHoldingSchema], market: String,
}, { timestamps: true }));

const CommodityModel = mongoose.model("Commodity", new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    name: String, type: String, investmentType: String, spotPrice: Number,
    change: Number, changePercent: Number, volume: String,
    currency: String, marketTrend: String,
}, { timestamps: true }));

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const stocks = [
    { symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ", price: 192.30, change: 2.45, changePercent: 1.29, volume: "52.3M", marketCap: "2.98T", sector: "Technology", marketTrend: "bullish" },
    { symbol: "MSFT", name: "Microsoft Corp.", market: "NASDAQ", price: 412.60, change: -1.80, changePercent: -0.43, volume: "18.7M", marketCap: "3.07T", sector: "Technology", marketTrend: "neutral" },
    { symbol: "GOOGL", name: "Alphabet Inc.", market: "NASDAQ", price: 168.90, change: 3.12, changePercent: 1.88, volume: "24.1M", marketCap: "2.12T", sector: "Technology", marketTrend: "bullish" },
    { symbol: "AMZN", name: "Amazon.com Inc.", market: "NASDAQ", price: 198.45, change: 4.67, changePercent: 2.41, volume: "41.2M", marketCap: "2.06T", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { symbol: "JPM", name: "JPMorgan Chase", market: "NYSE", price: 198.30, change: 1.20, changePercent: 0.61, volume: "8.9M", marketCap: "571.2B", sector: "Financial Services", marketTrend: "bullish" },
    { symbol: "V", name: "Visa Inc.", market: "NYSE", price: 287.50, change: -0.45, changePercent: -0.16, volume: "5.6M", marketCap: "589.3B", sector: "Financial Services", marketTrend: "neutral" },
    { symbol: "JNJ", name: "Johnson & Johnson", market: "NYSE", price: 156.80, change: 0.85, changePercent: 0.54, volume: "6.2M", marketCap: "378.1B", sector: "Healthcare", marketTrend: "bullish" },
    { symbol: "TSLA", name: "Tesla Inc.", market: "NASDAQ", price: 248.90, change: -5.30, changePercent: -2.08, volume: "89.4M", marketCap: "791.5B", sector: "Consumer Cyclical", marketTrend: "bearish" },
    { symbol: "NVDA", name: "NVIDIA Corp.", market: "NASDAQ", price: 878.40, change: 15.60, changePercent: 1.81, volume: "38.6M", marketCap: "2.17T", sector: "Technology", marketTrend: "bullish" },
    { symbol: "WMT", name: "Walmart Inc.", market: "NYSE", price: 172.30, change: 0.92, changePercent: 0.54, volume: "7.8M", marketCap: "464.2B", sector: "Consumer Defensive", marketTrend: "bullish" },
    { symbol: "META", name: "Meta Platforms Inc.", market: "NASDAQ", price: 485.20, change: 12.30, changePercent: 2.60, volume: "32.1M", marketCap: "1.45T", sector: "Technology", marketTrend: "bullish" },
    { symbol: "ADBE", name: "Adobe Inc.", market: "NASDAQ", price: 625.40, change: 8.50, changePercent: 1.38, volume: "2.8M", marketCap: "285.3B", sector: "Technology", marketTrend: "bullish" },
    { symbol: "INTC", name: "Intel Corp.", market: "NASDAQ", price: 42.85, change: -1.25, changePercent: -2.84, volume: "45.2M", marketCap: "178.5B", sector: "Technology", marketTrend: "bearish" },
    { symbol: "AMD", name: "Advanced Micro Devices", market: "NASDAQ", price: 156.75, change: 3.20, changePercent: 2.08, volume: "28.9M", marketCap: "255.2B", sector: "Technology", marketTrend: "bullish" },
    { symbol: "NKE", name: "Nike Inc.", market: "NYSE", price: 75.45, change: 1.20, changePercent: 1.62, volume: "6.5M", marketCap: "115.2B", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { symbol: "MCD", name: "McDonald's Corp.", market: "NYSE", price: 289.30, change: 2.15, changePercent: 0.75, volume: "1.9M", marketCap: "210.4B", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { symbol: "BAC", name: "Bank of America", market: "NYSE", price: 34.75, change: 0.65, changePercent: 1.90, volume: "45.2M", marketCap: "312.5B", sector: "Financial Services", marketTrend: "bullish" },
    { symbol: "GS", name: "Goldman Sachs", market: "NYSE", price: 412.15, change: 3.45, changePercent: 0.84, volume: "1.8M", marketCap: "141.3B", sector: "Financial Services", marketTrend: "bullish" },
    { symbol: "AXP", name: "American Express", market: "NYSE", price: 285.60, change: 2.10, changePercent: 0.74, volume: "1.5M", marketCap: "221.8B", sector: "Financial Services", marketTrend: "bullish" },
    { symbol: "UNH", name: "UnitedHealth Group", market: "NYSE", price: 515.75, change: 5.30, changePercent: 1.04, volume: "2.1M", marketCap: "496.2B", sector: "Healthcare", marketTrend: "bullish" },
    { symbol: "PFE", name: "Pfizer Inc.", market: "NYSE", price: 28.45, change: -0.85, changePercent: -2.90, volume: "28.5M", marketCap: "161.3B", sector: "Healthcare", marketTrend: "bearish" },
    { symbol: "MRK", name: "Merck & Co.", market: "NYSE", price: 72.30, change: 1.05, changePercent: 1.47, volume: "8.7M", marketCap: "183.2B", sector: "Healthcare", marketTrend: "bullish" },
    { symbol: "KO", name: "The Coca-Cola Co.", market: "NYSE", price: 61.40, change: 0.45, changePercent: 0.74, volume: "12.3M", marketCap: "265.8B", sector: "Consumer Defensive", marketTrend: "neutral" },
    { symbol: "PG", name: "Procter & Gamble", market: "NYSE", price: 167.50, change: 1.20, changePercent: 0.72, volume: "5.6M", marketCap: "398.5B", sector: "Consumer Defensive", marketTrend: "bullish" },
    { symbol: "XOM", name: "Exxon Mobil Corp.", market: "NYSE", price: 118.75, change: 2.30, changePercent: 1.98, volume: "15.2M", marketCap: "495.3B", sector: "Energy", marketTrend: "bullish" },
    { symbol: "CVX", name: "Chevron Corp.", market: "NYSE", price: 159.30, change: 1.85, changePercent: 1.17, volume: "8.9M", marketCap: "305.2B", sector: "Energy", marketTrend: "bullish" },
    { symbol: "BA", name: "Boeing Co.", market: "NYSE", price: 182.15, change: 4.50, changePercent: 2.53, volume: "5.4M", marketCap: "112.3B", sector: "Industrials", marketTrend: "bullish" },
    { symbol: "CAT", name: "Caterpillar Inc.", market: "NYSE", price: 345.20, change: 6.75, changePercent: 1.98, volume: "2.1M", marketCap: "185.7B", sector: "Industrials", marketTrend: "bullish" },
];

const bonds = [
    { symbol: "UST-10Y", issuer: "United States", type: "government", couponRate: 4.25, yieldToMaturity: 4.18, maturityDate: "2035-02-15", creditRating: "AAA", price: 98.5, par: 100, duration: 8.5, change: 0.32, changePercent: 0.32, market: "NASDAQ" },
    { symbol: "UST-30Y", issuer: "United States", type: "government", couponRate: 4.5, yieldToMaturity: 4.35, maturityDate: "2055-02-15", creditRating: "AAA", price: 97.2, par: 100, duration: 18.2, change: 0.45, changePercent: 0.46, market: "NASDAQ" },
    { symbol: "MSFT-21", issuer: "Microsoft", type: "corporate", couponRate: 3.75, yieldToMaturity: 3.85, maturityDate: "2031-05-20", creditRating: "AAA", price: 99.1, par: 100, duration: 5.2, change: 0.21, changePercent: 0.21, market: "NASDAQ" },
    { symbol: "AAPL-19", issuer: "Apple Inc.", type: "corporate", couponRate: 3.5, yieldToMaturity: 3.62, maturityDate: "2034-08-15", creditRating: "AA+", price: 98.8, par: 100, duration: 8.1, change: 0.18, changePercent: 0.18, market: "NASDAQ" },
    { symbol: "JNJ-22", issuer: "Johnson & Johnson", type: "corporate", couponRate: 4.0, yieldToMaturity: 4.12, maturityDate: "2032-09-20", creditRating: "AAA", price: 99.3, par: 100, duration: 6.8, change: 0.15, changePercent: 0.15, market: "NYSE" },
    { symbol: "HY-001", issuer: "Energy Corp", type: "high_yield", couponRate: 7.5, yieldToMaturity: 8.25, maturityDate: "2028-03-15", creditRating: "BB", price: 94.2, par: 100, duration: 2.3, change: -0.55, changePercent: -0.58, market: "NYSE" },
    { symbol: "HY-002", issuer: "Tech Startup Inc", type: "high_yield", couponRate: 8.0, yieldToMaturity: 9.15, maturityDate: "2027-12-01", creditRating: "B", price: 92.5, par: 100, duration: 1.8, change: -0.75, changePercent: -0.81, market: "NASDAQ" },
    { symbol: "MUN-CA", issuer: "California State", type: "municipal", couponRate: 3.5, yieldToMaturity: 3.45, maturityDate: "2040-01-01", creditRating: "AA", price: 100.2, par: 100, duration: 14.5, change: 0.12, changePercent: 0.12, market: "NYSE" },
];

const etfs = [
    { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", indexName: "S&P 500", expenseRatio: 0.03, nav: 462.85, price: 463.12, change: 2.15, changePercent: 0.47, aum: "$412.5B", volume: "78.5M", yield: 1.42, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.02, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 7.2 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.8 }, { symbol: "NVDA", name: "NVIDIA", percentage: 3.5 }] },
    { symbol: "QQQ", name: "Invesco QQQ Trust", indexName: "Nasdaq-100", expenseRatio: 0.20, nav: 425.30, price: 425.65, change: 3.45, changePercent: 0.82, aum: "$235.2B", volume: "65.3M", yield: 0.45, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.03, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 11.5 }, { symbol: "MSFT", name: "Microsoft", percentage: 10.8 }, { symbol: "NVDA", name: "NVIDIA", percentage: 9.2 }] },
    { symbol: "VTI", name: "Vanguard Total Stock Market ETF", indexName: "CRSP US Total Market", expenseRatio: 0.03, nav: 258.45, price: 258.67, change: 1.85, changePercent: 0.72, aum: "$355.8B", volume: "3.2M", yield: 1.68, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.01, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 6.5 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.2 }] },
    { symbol: "BND", name: "Vanguard Total Bond Market ETF", indexName: "Bloomberg Aggregate Bond", expenseRatio: 0.03, nav: 72.15, price: 72.18, change: 0.25, changePercent: 0.35, aum: "$95.2B", volume: "1.5M", yield: 4.65, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.02, holdings: [{ symbol: "UST-10Y", name: "US Treasury 10Y", percentage: 25.3 }] },
    { symbol: "MTUM", name: "iShares MSCI USA Momentum Factor ETF", expenseRatio: 0.15, nav: 185.45, price: 185.68, change: 2.95, changePercent: 1.61, aum: "$8.5B", volume: "892K", yield: 0.82, isIndexBased: false, isActivelyManaged: true, market: "NASDAQ", holdings: [{ symbol: "NVDA", name: "NVIDIA", percentage: 8.5 }, { symbol: "META", name: "Meta Platforms", percentage: 7.2 }] },
];

const mutualFunds = [
    { symbol: "VFIAX", name: "Vanguard 500 Index Fund Admiral", fundFamily: "Vanguard", fundType: "index", expenseRatio: 0.04, nav: 425.30, price: 425.30, change: 2.15, changePercent: 0.51, minimumInvestment: 3000, aum: "$185.5B", yield: 1.45, managerName: "Vanguard Index Management Team", managerTenure: 15, performance1Y: 28.5, performance3Y: 12.3, performance5Y: 14.8, market: "NASDAQ", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 7.1 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.9 }] },
    { symbol: "FAGIX", name: "Fidelity Growth Company Fund", fundFamily: "Fidelity", fundType: "actively_managed", expenseRatio: 0.69, nav: 188.45, price: 188.45, change: 3.25, changePercent: 1.75, minimumInvestment: 2500, aum: "$32.1B", yield: 0.25, managerName: "Will Danoff", managerTenure: 28, performance1Y: 35.2, performance3Y: 18.5, performance5Y: 19.2, market: "NASDAQ", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 5.2 }, { symbol: "NVDA", name: "NVIDIA", percentage: 4.8 }] },
    { symbol: "VBTLX", name: "Vanguard Total Bond Market Index Fund", fundFamily: "Vanguard", fundType: "index", expenseRatio: 0.05, nav: 10.85, price: 10.85, change: 0.12, changePercent: 1.12, minimumInvestment: 1000, aum: "$45.8B", yield: 4.78, managerName: "Vanguard Fixed Income Team", managerTenure: 12, performance1Y: 3.2, performance3Y: -1.5, performance5Y: 2.8, market: "NASDAQ", holdings: [{ symbol: "UST-10Y", name: "US Treasury 10Y", percentage: 22.5 }] },
    { symbol: "VGSLX", name: "Vanguard Global Stock Fund", fundFamily: "Vanguard", fundType: "actively_managed", expenseRatio: 0.30, nav: 145.68, price: 145.68, change: 1.85, changePercent: 1.29, minimumInvestment: 10000, aum: "$125.3B", yield: 1.35, managerName: "International Equity Team", managerTenure: 18, performance1Y: 22.5, performance3Y: 9.8, performance5Y: 11.5, market: "NYSE", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 3.2 }, { symbol: "MSFT", name: "Microsoft", percentage: 2.9 }] },
];

const commodities = [
    { symbol: "GLD", name: "Gold (SPDR ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 2089.50, change: 45.30, changePercent: 2.21, volume: "5.2M", currency: "USD", marketTrend: "bullish" },
    { symbol: "SLV", name: "Silver (iShares ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 31.45, change: 1.25, changePercent: 4.13, volume: "25.8M", currency: "USD", marketTrend: "bullish" },
    { symbol: "IAU", name: "Gold (iShares ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 209.85, change: 4.50, changePercent: 2.19, volume: "8.3M", currency: "USD", marketTrend: "bullish" },
    { symbol: "BZ=F", name: "Crude Oil (WTI Futures)", type: "energy", investmentType: "futures", spotPrice: 78.45, change: -1.25, changePercent: -1.57, volume: "250K", currency: "USD", marketTrend: "neutral" },
    { symbol: "NG=F", name: "Natural Gas Futures", type: "energy", investmentType: "futures", spotPrice: 3.125, change: 0.125, changePercent: 4.17, volume: "145K", currency: "USD", marketTrend: "bullish" },
    { symbol: "XLE", name: "Energy Sector ETF", type: "energy", investmentType: "etf", spotPrice: 95.32, change: -0.85, changePercent: -0.88, volume: "12.5M", currency: "USD", marketTrend: "bearish" },
    { symbol: "ZC=F", name: "Corn Futures", type: "agricultural", investmentType: "futures", spotPrice: 4.425, change: 0.125, changePercent: 2.91, volume: "98K", currency: "USD", marketTrend: "bullish" },
    { symbol: "ZS=F", name: "Soybean Futures", type: "agricultural", investmentType: "futures", spotPrice: 11.145, change: -0.185, changePercent: -1.64, volume: "78K", currency: "USD", marketTrend: "bearish" },
    { symbol: "DBC", name: "Commodities ETF", type: "agricultural", investmentType: "etf", spotPrice: 28.45, change: 0.95, changePercent: 3.45, volume: "4.2M", currency: "USD", marketTrend: "bullish" },
];

// ─── UPSERT HELPER ───────────────────────────────────────────────────────────

async function upsertAll(Model: mongoose.Model<any>, data: any[], label: string) {
    console.log(`\n📦 Seeding ${label}...`);
    let count = 0;
    for (const item of data) {
        await Model.findOneAndUpdate(
            { symbol: item.symbol },
            item,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        count++;
    }
    console.log(`   ✅ ${count} ${label} seeded (upserted).`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function seed() {
    await mongoose.connect(MONGODB_URI as string, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB!\n");

    await upsertAll(StockModel, stocks, "Stocks");
    await upsertAll(BondModel, bonds, "Bonds");
    await upsertAll(ETFModel, etfs, "ETFs");
    await upsertAll(MutualFundModel, mutualFunds, "Mutual Funds");
    await upsertAll(CommodityModel, commodities, "Commodities");

    console.log("\n🎉 Database seeded successfully!");
    console.log("   Collections: stocks, bonds, etfs, mutualfunds, commodities");
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message || err);
    process.exit(1);
});
