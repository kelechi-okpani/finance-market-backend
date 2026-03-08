/**
 * COMPREHENSIVE SEED SCRIPT
 * Populates MongoDB with:
 * 1. Market Data (Stocks, Bonds, ETFs, etc.)
 * 2. Mock Users and their associated data (Portfolios, Holdings, Transactions, etc.)
 * 3. KYC and Address Verification documents
 * 4. Admin Settings (Countries/Regions)
 * 
 * Run: npx tsx scripts/seed.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load env
config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found.");
    process.exit(1);
}

// ─── MODELS ──────────────────────────────────────────────────────────────────

// Stock
const StockSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    name: String, market: String, price: Number, change: Number,
    changePercent: Number, volume: String, marketCap: String,
    sector: String, marketTrend: String,
    isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// User
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: String,
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    address: String,
    country: String,
    role: { type: String, default: "user" },
    status: { type: String, default: "approved" },
    accountStatus: { type: String, default: "active" },
    accountType: { type: String, default: "individual" },
    kycStatus: { type: String, default: "verified" },
    kycVerified: { type: Boolean, default: true },
    riskTolerance: { type: String, default: "moderate" },
    baseCurrency: { type: String, default: "USD" },
    totalBalance: { type: Number, default: 0 },
    availableCash: { type: Number, default: 0 },
    onboardingStep: { type: Number, default: 16 },
}, { timestamps: true });

const PortfolioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    type: { type: String, default: 'stocks' },
}, { timestamps: true });

const HoldingSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    symbol: String,
    companyName: String,
    shares: Number,
    avgBuyPrice: Number,
    boughtAt: { type: Date, default: Date.now },
}, { timestamps: true });

const CashMovementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: String,
    amount: Number,
    currency: String,
    method: String,
    status: String,
    date: String,
}, { timestamps: true });

const ConnectedAccountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    provider: String,
    accountName: String,
    lastFour: String,
    balance: Number,
}, { timestamps: true });

const StockTransferSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    assetSymbol: String,
    assetName: String,
    shares: Number,
    valueAtTransfer: Number,
    fromUser: String,
    toUser: String,
    date: String,
    status: String,
    type: String,
}, { timestamps: true });

// KYC Document
const KYCDocumentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentType: { type: String, enum: ["passport", "drivers_license", "national_id", "voters_id"] },
    frontPageUrl: String,
    backPageUrl: String,
    status: { type: String, default: "pending" },
}, { timestamps: true });

// Address Verification
const AddressVerificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    houseNumber: String,
    streetAddress: String,
    city: String,
    stateProvince: String,
    zipCode: String,
    country: String,
    poaDocumentType: String,
    poaDocumentUrl: String,
    status: { type: String, default: "pending" },
}, { timestamps: true });

// Admin Settings
const AdminSettingsSchema = new mongoose.Schema({
    allowedCountries: [String],
    allowedRegions: [String],
}, { timestamps: true });

// Account Request
const AccountRequestSchema = new mongoose.Schema({
    firstName: String, lastName: String, email: String, phone: String, message: String, status: { type: String, default: 'pending' }
}, { timestamps: true });

const Stock = mongoose.models.Stock || mongoose.model("Stock", StockSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Portfolio = mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);
const Holding = mongoose.models.Holding || mongoose.model("Holding", HoldingSchema);
const CashMovement = mongoose.models.CashMovement || mongoose.model("CashMovement", CashMovementSchema);
const ConnectedAccount = mongoose.models.ConnectedAccount || mongoose.model("ConnectedAccount", ConnectedAccountSchema);
const StockTransfer = mongoose.models.StockTransfer || mongoose.model("StockTransfer", StockTransferSchema);
const KYCDocument = mongoose.models.KYCDocument || mongoose.model("KYCDocument", KYCDocumentSchema);
const AddressVerification = mongoose.models.AddressVerification || mongoose.model("AddressVerification", AddressVerificationSchema);
const AdminSettings = mongoose.models.AdminSettings || mongoose.model("AdminSettings", AdminSettingsSchema);
const AccountRequest = mongoose.models.AccountRequest || mongoose.model("AccountRequest", AccountRequestSchema);

// ─── DATA ────────────────────────────────────────────────────────────────────

const marketStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 182.52, change: 1.20, changePercent: 0.66, volume: "52M", marketCap: "2.82T", sector: "Technology", market: "NASDAQ", isPublished: true },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 405.32, change: -2.15, changePercent: -0.53, volume: "22M", marketCap: "3.01T", sector: "Technology", market: "NASDAQ", isPublished: true },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 145.12, change: 0.85, changePercent: 0.59, volume: "28M", marketCap: "1.81T", sector: "Communication Services", market: "NASDAQ", isPublished: false },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 175.05, change: 3.40, changePercent: 1.98, volume: "35M", marketCap: "1.81T", sector: "Consumer Cyclical", market: "NASDAQ", isPublished: true },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 726.13, change: 15.20, changePercent: 2.14, volume: "44M", marketCap: "1.79T", sector: "Technology", market: "NASDAQ", isPublished: true },
    { symbol: "TSLA", name: "Tesla, Inc.", price: 195.40, change: -4.20, changePercent: -2.10, volume: "95M", marketCap: "620B", sector: "Consumer Cyclical", market: "NASDAQ", isPublished: false },
    { symbol: "BTC", name: "Bitcoin", price: 90681.00, change: 1240.0, changePercent: 1.38, volume: "28B", marketCap: "1.7T", sector: "Crypto", market: "Binance", isPublished: true }
];

const mockUsers = [
    {
        profile: {
            firstName: "Julian",
            lastName: "Bernhardt",
            email: "julian@private-wealth.io",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julian",
            address: "Börsenstraße 12, Frankfurt",
            country: "Germany",
            phoneNumber: "+49 152 900 1234",
        },
        settings: {
            accountType: "personal",
            kycStatus: "verified",
            riskTolerance: "aggressive",
            baseCurrency: "EUR",
        },
        totalBalance: 58959.7,
        availableCash: 4250.25,
        portfolios: [
            {
                name: "Main Growth Portfolio",
                holdings: [
                    { symbol: "NVDA", name: "NVIDIA Corp.", shares: 25, avgPrice: 420.5 },
                    { symbol: "BTC", name: "Bitcoin", shares: 0.45, avgPrice: 42000.0 },
                ],
            },
        ],
        cashMovements: [
            { type: "deposit", amount: 25000.0, currency: "EUR", method: "SEPA Transfer", status: "completed", date: "2024-02-15T10:30:00Z" },
            { type: "withdrawal", amount: 5000.0, currency: "EUR", method: "Bank Account (...4492)", status: "completed", date: "2024-02-18T14:20:00Z" },
            { type: "deposit", amount: 1200.0, currency: "EUR", method: "Visa Card", status: "pending", date: "2024-03-01T09:00:00Z" },
            { type: "withdrawal", amount: 300.0, currency: "EUR", method: "PayPal", status: "pending", date: "2024-03-05T12:00:00Z" },
        ],
        connectedAccounts: [
            { provider: "Deutsche Bank", accountName: "Primary Checking", lastFour: "8821", balance: 14200.5 },
            { provider: "Coinbase", accountName: "Hot Wallet", lastFour: "0x4F", balance: 2450.0 },
        ],
        stockTransfers: [
            { assetSymbol: "NVDA", assetName: "NVIDIA Corp.", shares: 5, valueAtTransfer: 3630.65, fromUser: "Julian Bernhardt", toUser: "Internal Liquidity Pool", date: "2024-02-21T09:00:00Z", status: "completed", type: "outbound" },
            { assetSymbol: "BTC", assetName: "Bitcoin", shares: 0.1, valueAtTransfer: 9068.10, fromUser: "External Wallet (0x...f3)", toUser: "Julian Bernhardt", date: "2024-02-19T16:45:00Z", status: "completed", type: "inbound" }
        ],
        kyc: {
            documentType: "passport",
            frontPageUrl: "https://placehold.co/600x400?text=Passport+Front",
            backPageUrl: "https://placehold.co/600x400?text=Passport+Back",
            status: "pending"
        },
        addressVerification: {
            houseNumber: "12",
            streetAddress: "Börsenstraße",
            city: "Frankfurt",
            stateProvince: "Hesse",
            zipCode: "60313",
            country: "Germany",
            poaDocumentType: "utility_bill",
            poaDocumentUrl: "https://placehold.co/600x400?text=Utility+Bill",
            status: "pending"
        }
    },
    {
        profile: {
            firstName: "Admin",
            lastName: "User",
            email: "admin@stockinvest.com",
            avatar: "",
            address: "Admin HQ",
            country: "United States",
            phoneNumber: "+1 000 000 0000",
        },
        settings: {
            accountType: "corporate",
            kycStatus: "verified",
            riskTolerance: "conservative",
            baseCurrency: "USD",
        },
        role: "admin",
        totalBalance: 0,
        availableCash: 0,
        portfolios: [],
        cashMovements: [],
        connectedAccounts: [],
        stockTransfers: [],
    }
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function seed() {
    console.log("🌱 Starting comprehensive seed...");

    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB.");

    // 1. Seed Market Data
    console.log("📦 Seeding Market Stocks...");
    for (const s of marketStocks) {
        await Stock.findOneAndUpdate({ symbol: s.symbol }, s, { upsert: true });
    }

    // 2. Admin Settings
    console.log("⚙️  Seeding Admin Settings...");
    await AdminSettings.findOneAndUpdate({}, {
        $set: {
            allowedCountries: ["United States", "United Kingdom", "Germany", "Nigeria", "Canada"],
            allowedRegions: ["North America", "Europe", "Africa"]
        }
    }, { upsert: true });

    // 3. Seed Users and related data
    console.log("👤 Seeding Users...");
    const passwordHash = await bcrypt.hash("Password123!", 10);

    for (const userData of mockUsers) {
        const user = await User.findOneAndUpdate(
            { email: userData.profile.email },
            {
                email: userData.profile.email,
                passwordHash,
                firstName: userData.profile.firstName,
                lastName: userData.profile.lastName,
                phone: userData.profile.phoneNumber,
                avatar: userData.profile.avatar,
                address: userData.profile.address,
                country: userData.profile.country,
                role: userData.role || "user",
                accountType: userData.settings.accountType,
                kycStatus: userData.settings.kycStatus,
                riskTolerance: userData.settings.riskTolerance,
                baseCurrency: userData.settings.baseCurrency,
                totalBalance: userData.totalBalance,
                availableCash: userData.availableCash,
                kycVerified: userData.settings.kycStatus === "verified",
                status: "approved",
                accountStatus: "active",
                onboardingStep: 16
            },
            { upsert: true, new: true }
        );

        console.log(`   - Seeded user: ${user.email}`);

        // Clear and Seed related data
        await Portfolio.deleteMany({ userId: user._id });
        await CashMovement.deleteMany({ userId: user._id });
        await ConnectedAccount.deleteMany({ userId: user._id });
        await StockTransfer.deleteMany({ userId: user._id });
        await KYCDocument.deleteMany({ userId: user._id });
        await AddressVerification.deleteMany({ userId: user._id });

        // Seed Portfolios
        for (const pData of userData.portfolios) {
            const portfolio = await Portfolio.create({ userId: user._id, name: pData.name, type: 'stocks' });
            for (const hData of pData.holdings) {
                await Holding.create({
                    portfolioId: portfolio._id,
                    userId: user._id,
                    symbol: hData.symbol,
                    companyName: hData.name,
                    shares: hData.shares,
                    avgBuyPrice: hData.avgPrice,
                });
            }
        }

        // Seed Cash Movements
        for (const cm of userData.cashMovements) {
            await CashMovement.create({ ...cm, userId: user._id });
        }

        // Seed Connected Accounts
        for (const ca of userData.connectedAccounts) {
            await ConnectedAccount.create({ ...ca, userId: user._id });
        }

        // Seed Stock Transfers
        for (const st of userData.stockTransfers) {
            await StockTransfer.create({ ...st, userId: user._id });
        }

        // Seed Documents if any
        if (userData.kyc) {
            await KYCDocument.create({ ...userData.kyc, userId: user._id });
        }
        if (userData.addressVerification) {
            await AddressVerification.create({ ...userData.addressVerification, userId: user._id });
        }
    }

    // 4. Seed some pending Account Requests
    console.log("📨 Seeding Account Requests...");
    await AccountRequest.deleteMany({});
    await AccountRequest.create([
        { firstName: "Elena", lastName: "Gilbert", email: "elena@mystic.com", phone: "+1 234 567 890", message: "Interested in high-growth portfolios.", status: "pending" },
        { firstName: "Damon", lastName: "Salvatore", email: "damon@mystic.com", phone: "+1 987 654 321", message: "Crypto specialist.", status: "pending" }
    ]);

    console.log("\n🎉 Database comprehensive seed successful!");
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
