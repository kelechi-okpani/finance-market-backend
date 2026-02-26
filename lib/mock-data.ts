// ============================================================
// CENTRAL MOCK DATA STORE
// This file imports and re-exports all mock data for use in API routes.
// In production, these are replaced by real MongoDB queries.
// ============================================================

// ========== TYPES ==========

export type UserStatus = "pending_approval" | "approved" | "rejected" | "onboarding";
export type PortfolioStatus = "active" | "pending" | "processing" | "transferred";
export type RequestStatus = "pending" | "approved" | "rejected";
export type TransactionType = "deposit" | "withdrawal" | "transfer_sent" | "transfer_received" | "buy" | "sell";
export type AssetClass = "stock" | "bond" | "etf" | "mutual_fund" | "commodity";

export interface UserRequest {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    status: RequestStatus;
    requestDate: string;
    approvedDate?: string;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    currency: string;
    date: string;
    description: string;
    paymentMethod?: string;
    status: "completed" | "pending" | "failed";
    relatedUser?: string;
}

export interface PaymentMethod {
    id: string;
    type: "bank_transfer" | "credit_card" | "debit_card" | "digital_wallet";
    name: string;
    details: string;
    isDefault: boolean;
}

export interface PerformanceData {
    date: string;
    value: number;
    gain: number;
}

export interface Holding {
    id: string;
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    change: number;
    quantity: number;
    changePercent: number;
    value: number;
    market: string;
    purchaseDate: string;
    projectedReturnPercent: number;
    investmentDuration: number;
    performanceHistory: PerformanceData[];
}

export interface Portfolio {
    id: string;
    name: string;
    uniqueIdentifier: string;
    authorizationCode: string;
    type: "new" | "inherited";
    status: PortfolioStatus;
    totalValue: number;
    totalGain: number;
    gainPercent: number;
    holdings: Holding[];
    createdAt: string;
    transferProgress?: number;
}

export interface MockUser {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    dateOfBirth: string;
    address: string;
    occupation: string;
    status: UserStatus;
    kycCompleted: boolean;
    agreementSigned: boolean;
    signatureType: "name" | "upload";
    signatureUrl?: string;
    portfolios: Portfolio[];
    createdAt: string;
    accountBalance: number;
    savedPaymentMethods: PaymentMethod[];
    transactions: Transaction[];
}

export interface Stock {
    id: string;
    symbol: string;
    name: string;
    market: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    marketCap: string;
    sector: string;
    peRatio?: number;
    dividend?: number;
    marketTrend?: "bullish" | "bearish" | "neutral";
    description?: string;
}

export interface Bond {
    id: string;
    symbol: string;
    issuer: string;
    type: "corporate" | "government" | "municipal" | "high_yield";
    couponRate: number;
    yieldToMaturity: number;
    maturityDate: string;
    creditRating: string;
    price: number;
    par: number;
    duration: number;
    change: number;
    changePercent: number;
    market: string;
}

export interface ETFHolding { symbol: string; name: string; percentage: number; }

export interface ETF {
    id: string;
    symbol: string;
    name: string;
    indexName?: string;
    expenseRatio: number;
    nav: number;
    price: number;
    change: number;
    changePercent: number;
    aum: string;
    volume: string;
    yield?: number;
    isIndexBased: boolean;
    isActivelyManaged: boolean;
    holdings: ETFHolding[];
    market: string;
    trackingError?: number;
}

export interface MutualFundHolding { symbol: string; name: string; percentage: number; }

export interface MutualFund {
    id: string;
    symbol: string;
    name: string;
    fundFamily: string;
    fundType: "index" | "actively_managed" | "balanced";
    expenseRatio: number;
    nav: number;
    price: number;
    change: number;
    changePercent: number;
    minimumInvestment: number;
    aum: string;
    yield?: number;
    managerName: string;
    managerTenure: number;
    performance1Y: number;
    performance3Y: number;
    performance5Y: number;
    holdings: MutualFundHolding[];
    market: string;
}

export interface Commodity {
    id: string;
    symbol: string;
    name: string;
    type: "precious_metal" | "energy" | "agricultural";
    investmentType: "physical" | "etf" | "futures";
    spotPrice: number;
    change: number;
    changePercent: number;
    purity?: string;
    volume: string;
    currency: string;
    marketTrend?: "bullish" | "bearish" | "neutral";
}

// ========== MOCK DATA ==========

export const mockUserRequests: UserRequest[] = [
    { id: "req-001", fullName: "James Thompson", email: "james.thompson@email.com", phone: "+1 (555) 123-4567", country: "United States", status: "pending", requestDate: "2026-02-01" },
    { id: "req-002", fullName: "Sarah Mitchell", email: "sarah.mitchell@email.com", phone: "+44 7700 900123", country: "United Kingdom", status: "pending", requestDate: "2026-02-03" },
    { id: "req-003", fullName: "Carlos Rivera", email: "carlos.rivera@email.com", phone: "+34 612 345 678", country: "Spain", status: "approved", requestDate: "2026-01-20", approvedDate: "2026-01-22" },
    { id: "req-004", fullName: "Aisha Patel", email: "aisha.patel@email.com", phone: "+91 98765 43210", country: "India", status: "rejected", requestDate: "2026-01-15" },
    { id: "req-005", fullName: "Oliver Schmidt", email: "oliver.schmidt@email.com", phone: "+49 170 1234567", country: "Germany", status: "pending", requestDate: "2026-02-05" },
];

export const mockUsers: MockUser[] = [
    {
        id: "user-001", fullName: "Carlos Rivera", email: "carlos.rivera@email.com", phone: "+34 612 345 678",
        country: "Spain", dateOfBirth: "1985-06-15", address: "123 Gran Via, Madrid, Spain", occupation: "Software Engineer",
        status: "approved", kycCompleted: true, agreementSigned: true, signatureType: "name",
        accountBalance: 15250.75, createdAt: "2025-10-22",
        savedPaymentMethods: [
            { id: "pm-001", type: "bank_transfer", name: "Banco Santander", details: "ES91 2100 0418 4502 0005 1332", isDefault: true },
            { id: "pm-002", type: "credit_card", name: "Visa Card", details: "•••• 4242", isDefault: false },
            { id: "pm-003", type: "digital_wallet", name: "PayPal", details: "carlos.rivera@email.com", isDefault: false },
        ],
        portfolios: [
            {
                id: "port-001", name: "Growth Portfolio", uniqueIdentifier: "VP-2026-GRW-001",
                authorizationCode: "AUTH-XK9P2M", type: "new", status: "active",
                totalValue: 48520.3, totalGain: 3520.3, gainPercent: 7.82, createdAt: "2025-10-25",
                holdings: [
                    { id: "h-001", symbol: "AAPL", name: "Apple Inc.", shares: 25, avgPrice: 178.5, currentPrice: 192.3, change: 2.45, changePercent: 1.29, value: 4807.5, market: "NASDAQ", purchaseDate: "2025-10-25", projectedReturnPercent: 12.5, investmentDuration: 4, quantity: 1, performanceHistory: [{ date: "2025-10-25", value: 4462.5, gain: 0 }, { date: "2026-02-10", value: 4807.5, gain: 345.0 }] },
                    { id: "h-002", symbol: "MSFT", name: "Microsoft Corp.", shares: 15, avgPrice: 380.2, currentPrice: 412.6, change: -1.8, changePercent: -0.43, value: 6189.0, market: "NASDAQ", purchaseDate: "2025-10-25", projectedReturnPercent: 15.8, investmentDuration: 4, quantity: 1, performanceHistory: [{ date: "2025-10-25", value: 5703.0, gain: 0 }, { date: "2026-02-10", value: 6189.0, gain: 486.0 }] },
                    { id: "h-003", symbol: "GOOGL", name: "Alphabet Inc.", shares: 20, avgPrice: 145.0, currentPrice: 168.9, change: 3.12, changePercent: 1.88, value: 3378.0, market: "NASDAQ", purchaseDate: "2025-11-15", projectedReturnPercent: 18.2, investmentDuration: 3, quantity: 1, performanceHistory: [{ date: "2025-11-15", value: 2900.0, gain: 0 }, { date: "2026-02-10", value: 3378.0, gain: 478.0 }] },
                ],
            },
            {
                id: "port-002", name: "Conservative Portfolio", uniqueIdentifier: "VP-2026-CON-002",
                authorizationCode: "AUTH-XK9P2M", type: "new", status: "active",
                totalValue: 32150.5, totalGain: 1050.5, gainPercent: 3.37, createdAt: "2025-12-01",
                holdings: [
                    { id: "h-004", symbol: "JNJ", name: "Johnson & Johnson", shares: 40, avgPrice: 152.0, currentPrice: 156.8, change: 0.85, changePercent: 0.54, value: 6272.0, market: "NYSE", purchaseDate: "2025-12-01", projectedReturnPercent: 8.5, investmentDuration: 2, quantity: 2, performanceHistory: [{ date: "2025-12-01", value: 6080.0, gain: 0 }, { date: "2026-02-10", value: 6272.0, gain: 192.0 }] },
                    { id: "h-005", symbol: "WMT", name: "Walmart Inc.", shares: 55, avgPrice: 168.5, currentPrice: 172.3, change: 0.92, changePercent: 0.54, value: 9476.5, market: "NYSE", purchaseDate: "2025-12-01", projectedReturnPercent: 7.2, investmentDuration: 2, quantity: 2, performanceHistory: [{ date: "2025-12-01", value: 9267.5, gain: 0 }, { date: "2026-02-10", value: 9476.5, gain: 209.0 }] },
                    { id: "h-006", symbol: "V", name: "Visa Inc.", shares: 12, avgPrice: 283.0, currentPrice: 287.5, change: -0.45, changePercent: -0.16, value: 3450.0, market: "NYSE", purchaseDate: "2025-12-15", projectedReturnPercent: 9.8, investmentDuration: 2, quantity: 2, performanceHistory: [{ date: "2025-12-15", value: 3396.0, gain: 0 }, { date: "2026-02-10", value: 3450.0, gain: 54.0 }] },
                ],
            },
        ],
        transactions: [
            { id: "txn-001", type: "deposit", amount: 25000.0, currency: "EUR", date: "2025-10-15", description: "Initial deposit", paymentMethod: "Bank Transfer", status: "completed" },
            { id: "txn-002", type: "buy", amount: 4462.5, currency: "EUR", date: "2025-10-25", description: "Bought 25 shares of AAPL", status: "completed" },
            { id: "txn-003", type: "buy", amount: 5703.0, currency: "EUR", date: "2025-10-25", description: "Bought 15 shares of MSFT", status: "completed" },
            { id: "txn-004", type: "deposit", amount: 15000.0, currency: "EUR", date: "2025-11-10", description: "Additional deposit", paymentMethod: "Credit Card", status: "completed" },
            { id: "txn-005", type: "buy", amount: 2900.0, currency: "EUR", date: "2025-11-15", description: "Bought 20 shares of GOOGL", status: "completed" },
            { id: "txn-006", type: "deposit", amount: 12000.0, currency: "EUR", date: "2025-11-28", description: "Deposit via PayPal", paymentMethod: "Digital Wallet", status: "completed" },
            { id: "txn-007", type: "buy", amount: 6080.0, currency: "EUR", date: "2025-12-01", description: "Bought 40 shares of JNJ", status: "completed" },
            { id: "txn-008", type: "buy", amount: 9267.5, currency: "EUR", date: "2025-12-01", description: "Bought 55 shares of WMT", status: "completed" },
            { id: "txn-009", type: "buy", amount: 3396.0, currency: "EUR", date: "2025-12-15", description: "Bought 12 shares of V", status: "completed" },
            { id: "txn-010", type: "withdrawal", amount: 5000.0, currency: "EUR", date: "2026-01-20", description: "Withdrawal to bank account", paymentMethod: "Bank Transfer", status: "completed" },
            { id: "txn-011", type: "deposit", amount: 8000.0, currency: "EUR", date: "2026-02-05", description: "Deposit via bank transfer", paymentMethod: "Bank Transfer", status: "completed" },
        ],
    },
    {
        id: "user-002", fullName: "Emily Watson", email: "emily.watson@email.com", phone: "+1 (555) 987-6543",
        country: "United States", dateOfBirth: "1990-03-22", address: "456 Wall Street, New York, NY", occupation: "Financial Analyst",
        status: "pending_approval", kycCompleted: true, agreementSigned: true, signatureType: "upload",
        accountBalance: 5000.0, createdAt: "2026-02-01",
        savedPaymentMethods: [{ id: "pm-004", type: "bank_transfer", name: "Chase Bank", details: "****1234", isDefault: true }],
        portfolios: [],
        transactions: [{ id: "txn-012", type: "deposit", amount: 5000.0, currency: "USD", date: "2026-02-01", description: "Initial deposit", paymentMethod: "Bank Transfer", status: "completed" }],
    },
];

export const mockStocks: Stock[] = [
    { id: "stk-001", symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ", price: 192.30, change: 2.45, changePercent: 1.29, volume: "52.3M", marketCap: "2.98T", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-002", symbol: "MSFT", name: "Microsoft Corp.", market: "NASDAQ", price: 412.60, change: -1.80, changePercent: -0.43, volume: "18.7M", marketCap: "3.07T", sector: "Technology", marketTrend: "neutral" },
    { id: "stk-003", symbol: "GOOGL", name: "Alphabet Inc.", market: "NASDAQ", price: 168.90, change: 3.12, changePercent: 1.88, volume: "24.1M", marketCap: "2.12T", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-004", symbol: "AMZN", name: "Amazon.com Inc.", market: "NASDAQ", price: 198.45, change: 4.67, changePercent: 2.41, volume: "41.2M", marketCap: "2.06T", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { id: "stk-005", symbol: "JPM", name: "JPMorgan Chase", market: "NYSE", price: 198.30, change: 1.20, changePercent: 0.61, volume: "8.9M", marketCap: "571.2B", sector: "Financial Services", marketTrend: "bullish" },
    { id: "stk-006", symbol: "V", name: "Visa Inc.", market: "NYSE", price: 287.50, change: -0.45, changePercent: -0.16, volume: "5.6M", marketCap: "589.3B", sector: "Financial Services", marketTrend: "neutral" },
    { id: "stk-007", symbol: "JNJ", name: "Johnson & Johnson", market: "NYSE", price: 156.80, change: 0.85, changePercent: 0.54, volume: "6.2M", marketCap: "378.1B", sector: "Healthcare", marketTrend: "bullish" },
    { id: "stk-008", symbol: "TSLA", name: "Tesla Inc.", market: "NASDAQ", price: 248.90, change: -5.30, changePercent: -2.08, volume: "89.4M", marketCap: "791.5B", sector: "Consumer Cyclical", marketTrend: "bearish" },
    { id: "stk-009", symbol: "NVDA", name: "NVIDIA Corp.", market: "NASDAQ", price: 878.40, change: 15.60, changePercent: 1.81, volume: "38.6M", marketCap: "2.17T", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-010", symbol: "WMT", name: "Walmart Inc.", market: "NYSE", price: 172.30, change: 0.92, changePercent: 0.54, volume: "7.8M", marketCap: "464.2B", sector: "Consumer Defensive", marketTrend: "bullish" },
    { id: "stk-015", symbol: "META", name: "Meta Platforms Inc.", market: "NASDAQ", price: 485.20, change: 12.30, changePercent: 2.60, volume: "32.1M", marketCap: "1.45T", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-016", symbol: "ADBE", name: "Adobe Inc.", market: "NASDAQ", price: 625.40, change: 8.50, changePercent: 1.38, volume: "2.8M", marketCap: "285.3B", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-017", symbol: "INTC", name: "Intel Corp.", market: "NASDAQ", price: 42.85, change: -1.25, changePercent: -2.84, volume: "45.2M", marketCap: "178.5B", sector: "Technology", marketTrend: "bearish" },
    { id: "stk-018", symbol: "AMD", name: "Advanced Micro Devices", market: "NASDAQ", price: 156.75, change: 3.20, changePercent: 2.08, volume: "28.9M", marketCap: "255.2B", sector: "Technology", marketTrend: "bullish" },
    { id: "stk-019", symbol: "NKE", name: "Nike Inc.", market: "NYSE", price: 75.45, change: 1.20, changePercent: 1.62, volume: "6.5M", marketCap: "115.2B", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { id: "stk-020", symbol: "MCD", name: "McDonald's Corp.", market: "NYSE", price: 289.30, change: 2.15, changePercent: 0.75, volume: "1.9M", marketCap: "210.4B", sector: "Consumer Cyclical", marketTrend: "bullish" },
    { id: "stk-021", symbol: "BAC", name: "Bank of America", market: "NYSE", price: 34.75, change: 0.65, changePercent: 1.90, volume: "45.2M", marketCap: "312.5B", sector: "Financial Services", marketTrend: "bullish" },
    { id: "stk-022", symbol: "GS", name: "Goldman Sachs", market: "NYSE", price: 412.15, change: 3.45, changePercent: 0.84, volume: "1.8M", marketCap: "141.3B", sector: "Financial Services", marketTrend: "bullish" },
    { id: "stk-023", symbol: "AXP", name: "American Express", market: "NYSE", price: 285.60, change: 2.10, changePercent: 0.74, volume: "1.5M", marketCap: "221.8B", sector: "Financial Services", marketTrend: "bullish" },
    { id: "stk-024", symbol: "UNH", name: "UnitedHealth Group", market: "NYSE", price: 515.75, change: 5.30, changePercent: 1.04, volume: "2.1M", marketCap: "496.2B", sector: "Healthcare", marketTrend: "bullish" },
    { id: "stk-025", symbol: "PFE", name: "Pfizer Inc.", market: "NYSE", price: 28.45, change: -0.85, changePercent: -2.90, volume: "28.5M", marketCap: "161.3B", sector: "Healthcare", marketTrend: "bearish" },
    { id: "stk-026", symbol: "MRK", name: "Merck & Co.", market: "NYSE", price: 72.30, change: 1.05, changePercent: 1.47, volume: "8.7M", marketCap: "183.2B", sector: "Healthcare", marketTrend: "bullish" },
    { id: "stk-027", symbol: "KO", name: "The Coca-Cola Co.", market: "NYSE", price: 61.40, change: 0.45, changePercent: 0.74, volume: "12.3M", marketCap: "265.8B", sector: "Consumer Defensive", marketTrend: "neutral" },
    { id: "stk-028", symbol: "PG", name: "Procter & Gamble", market: "NYSE", price: 167.50, change: 1.20, changePercent: 0.72, volume: "5.6M", marketCap: "398.5B", sector: "Consumer Defensive", marketTrend: "bullish" },
    { id: "stk-029", symbol: "XOM", name: "Exxon Mobil Corp.", market: "NYSE", price: 118.75, change: 2.30, changePercent: 1.98, volume: "15.2M", marketCap: "495.3B", sector: "Energy", marketTrend: "bullish" },
    { id: "stk-030", symbol: "CVX", name: "Chevron Corp.", market: "NYSE", price: 159.30, change: 1.85, changePercent: 1.17, volume: "8.9M", marketCap: "305.2B", sector: "Energy", marketTrend: "bullish" },
    { id: "stk-031", symbol: "BA", name: "Boeing Co.", market: "NYSE", price: 182.15, change: 4.50, changePercent: 2.53, volume: "5.4M", marketCap: "112.3B", sector: "Industrials", marketTrend: "bullish" },
    { id: "stk-032", symbol: "CAT", name: "Caterpillar Inc.", market: "NYSE", price: 345.20, change: 6.75, changePercent: 1.98, volume: "2.1M", marketCap: "185.7B", sector: "Industrials", marketTrend: "bullish" },
];

export const mockBonds: Bond[] = [
    { id: "bnd-001", symbol: "UST-10Y", issuer: "United States", type: "government", couponRate: 4.25, yieldToMaturity: 4.18, maturityDate: "2035-02-15", creditRating: "AAA", price: 98.5, par: 100, duration: 8.5, change: 0.32, changePercent: 0.32, market: "NASDAQ" },
    { id: "bnd-002", symbol: "UST-30Y", issuer: "United States", type: "government", couponRate: 4.5, yieldToMaturity: 4.35, maturityDate: "2055-02-15", creditRating: "AAA", price: 97.2, par: 100, duration: 18.2, change: 0.45, changePercent: 0.46, market: "NASDAQ" },
    { id: "bnd-003", symbol: "MSFT-21", issuer: "Microsoft", type: "corporate", couponRate: 3.75, yieldToMaturity: 3.85, maturityDate: "2031-05-20", creditRating: "AAA", price: 99.1, par: 100, duration: 5.2, change: 0.21, changePercent: 0.21, market: "NASDAQ" },
    { id: "bnd-004", symbol: "AAPL-19", issuer: "Apple Inc.", type: "corporate", couponRate: 3.5, yieldToMaturity: 3.62, maturityDate: "2034-08-15", creditRating: "AA+", price: 98.8, par: 100, duration: 8.1, change: 0.18, changePercent: 0.18, market: "NASDAQ" },
    { id: "bnd-005", symbol: "JNJ-22", issuer: "Johnson & Johnson", type: "corporate", couponRate: 4.0, yieldToMaturity: 4.12, maturityDate: "2032-09-20", creditRating: "AAA", price: 99.3, par: 100, duration: 6.8, change: 0.15, changePercent: 0.15, market: "NYSE" },
    { id: "bnd-006", symbol: "HY-001", issuer: "Energy Corp", type: "high_yield", couponRate: 7.5, yieldToMaturity: 8.25, maturityDate: "2028-03-15", creditRating: "BB", price: 94.2, par: 100, duration: 2.3, change: -0.55, changePercent: -0.58, market: "NYSE" },
    { id: "bnd-007", symbol: "HY-002", issuer: "Tech Startup Inc", type: "high_yield", couponRate: 8.0, yieldToMaturity: 9.15, maturityDate: "2027-12-01", creditRating: "B", price: 92.5, par: 100, duration: 1.8, change: -0.75, changePercent: -0.81, market: "NASDAQ" },
    { id: "bnd-008", symbol: "MUN-CA", issuer: "California State", type: "municipal", couponRate: 3.5, yieldToMaturity: 3.45, maturityDate: "2040-01-01", creditRating: "AA", price: 100.2, par: 100, duration: 14.5, change: 0.12, changePercent: 0.12, market: "NYSE" },
];

export const mockETFs: ETF[] = [
    { id: "etf-001", symbol: "SPY", name: "SPDR S&P 500 ETF Trust", indexName: "S&P 500", expenseRatio: 0.03, nav: 462.85, price: 463.12, change: 2.15, changePercent: 0.47, aum: "$412.5B", volume: "78.5M", yield: 1.42, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.02, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 7.2 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.8 }, { symbol: "NVDA", name: "NVIDIA", percentage: 3.5 }] },
    { id: "etf-002", symbol: "QQQ", name: "Invesco QQQ Trust", indexName: "Nasdaq-100", expenseRatio: 0.20, nav: 425.30, price: 425.65, change: 3.45, changePercent: 0.82, aum: "$235.2B", volume: "65.3M", yield: 0.45, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.03, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 11.5 }, { symbol: "MSFT", name: "Microsoft", percentage: 10.8 }, { symbol: "NVDA", name: "NVIDIA", percentage: 9.2 }] },
    { id: "etf-003", symbol: "VTI", name: "Vanguard Total Stock Market ETF", indexName: "CRSP US Total Market", expenseRatio: 0.03, nav: 258.45, price: 258.67, change: 1.85, changePercent: 0.72, aum: "$355.8B", volume: "3.2M", yield: 1.68, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.01, holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 6.5 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.2 }] },
    { id: "etf-004", symbol: "BND", name: "Vanguard Total Bond Market ETF", indexName: "Bloomberg Aggregate Bond", expenseRatio: 0.03, nav: 72.15, price: 72.18, change: 0.25, changePercent: 0.35, aum: "$95.2B", volume: "1.5M", yield: 4.65, isIndexBased: true, isActivelyManaged: false, market: "NASDAQ", trackingError: 0.02, holdings: [{ symbol: "UST-10Y", name: "US Treasury 10Y", percentage: 25.3 }] },
    { id: "etf-005", symbol: "MTUM", name: "iShares MSCI USA Momentum Factor ETF", expenseRatio: 0.15, nav: 185.45, price: 185.68, change: 2.95, changePercent: 1.61, aum: "$8.5B", volume: "892K", yield: 0.82, isIndexBased: false, isActivelyManaged: true, market: "NASDAQ", holdings: [{ symbol: "NVDA", name: "NVIDIA", percentage: 8.5 }, { symbol: "META", name: "Meta Platforms", percentage: 7.2 }] },
];

export const mockMutualFunds: MutualFund[] = [
    { id: "mf-001", symbol: "VFIAX", name: "Vanguard 500 Index Fund Admiral", fundFamily: "Vanguard", fundType: "index", expenseRatio: 0.04, nav: 425.30, price: 425.30, change: 2.15, changePercent: 0.51, minimumInvestment: 3000, aum: "$185.5B", yield: 1.45, managerName: "Vanguard Index Management Team", managerTenure: 15, performance1Y: 28.5, performance3Y: 12.3, performance5Y: 14.8, market: "NASDAQ", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 7.1 }, { symbol: "MSFT", name: "Microsoft", percentage: 6.9 }] },
    { id: "mf-002", symbol: "FAGIX", name: "Fidelity Growth Company Fund", fundFamily: "Fidelity", fundType: "actively_managed", expenseRatio: 0.69, nav: 188.45, price: 188.45, change: 3.25, changePercent: 1.75, minimumInvestment: 2500, aum: "$32.1B", yield: 0.25, managerName: "Will Danoff", managerTenure: 28, performance1Y: 35.2, performance3Y: 18.5, performance5Y: 19.2, market: "NASDAQ", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 5.2 }, { symbol: "NVDA", name: "NVIDIA", percentage: 4.8 }] },
    { id: "mf-003", symbol: "VBTLX", name: "Vanguard Total Bond Market Index Fund", fundFamily: "Vanguard", fundType: "index", expenseRatio: 0.05, nav: 10.85, price: 10.85, change: 0.12, changePercent: 1.12, minimumInvestment: 1000, aum: "$45.8B", yield: 4.78, managerName: "Vanguard Fixed Income Team", managerTenure: 12, performance1Y: 3.2, performance3Y: -1.5, performance5Y: 2.8, market: "NASDAQ", holdings: [{ symbol: "UST-10Y", name: "US Treasury 10Y", percentage: 22.5 }] },
    { id: "mf-004", symbol: "VGSLX", name: "Vanguard Global Stock Fund", fundFamily: "Vanguard", fundType: "actively_managed", expenseRatio: 0.30, nav: 145.68, price: 145.68, change: 1.85, changePercent: 1.29, minimumInvestment: 10000, aum: "$125.3B", yield: 1.35, managerName: "International Equity Team", managerTenure: 18, performance1Y: 22.5, performance3Y: 9.8, performance5Y: 11.5, market: "NYSE", holdings: [{ symbol: "AAPL", name: "Apple Inc.", percentage: 3.2 }, { symbol: "MSFT", name: "Microsoft", percentage: 2.9 }] },
];

export const mockCommodities: Commodity[] = [
    { id: "cmd-001", symbol: "GLD", name: "Gold (SPDR ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 2089.50, change: 45.30, changePercent: 2.21, volume: "5.2M", currency: "USD", marketTrend: "bullish" },
    { id: "cmd-002", symbol: "SLV", name: "Silver (iShares ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 31.45, change: 1.25, changePercent: 4.13, volume: "25.8M", currency: "USD", marketTrend: "bullish" },
    { id: "cmd-003", symbol: "IAU", name: "Gold (iShares ETF)", type: "precious_metal", investmentType: "etf", spotPrice: 209.85, change: 4.50, changePercent: 2.19, volume: "8.3M", currency: "USD", marketTrend: "bullish" },
    { id: "cmd-004", symbol: "BZ=F", name: "Crude Oil (WTI Futures)", type: "energy", investmentType: "futures", spotPrice: 78.45, change: -1.25, changePercent: -1.57, volume: "250K", currency: "USD", marketTrend: "neutral" },
    { id: "cmd-005", symbol: "NG=F", name: "Natural Gas Futures", type: "energy", investmentType: "futures", spotPrice: 3.125, change: 0.125, changePercent: 4.17, volume: "145K", currency: "USD", marketTrend: "bullish" },
    { id: "cmd-006", symbol: "XLE", name: "Energy Sector ETF", type: "energy", investmentType: "etf", spotPrice: 95.32, change: -0.85, changePercent: -0.88, volume: "12.5M", currency: "USD", marketTrend: "bearish" },
    { id: "cmd-007", symbol: "ZC=F", name: "Corn Futures", type: "agricultural", investmentType: "futures", spotPrice: 4.425, change: 0.125, changePercent: 2.91, volume: "98K", currency: "USD", marketTrend: "bullish" },
    { id: "cmd-008", symbol: "ZS=F", name: "Soybean Futures", type: "agricultural", investmentType: "futures", spotPrice: 11.145, change: -0.185, changePercent: -1.64, volume: "78K", currency: "USD", marketTrend: "bearish" },
    { id: "cmd-009", symbol: "DBC", name: "Commodities ETF", type: "agricultural", investmentType: "etf", spotPrice: 28.45, change: 0.95, changePercent: 3.45, volume: "4.2M", currency: "USD", marketTrend: "bullish" },
];
