export type AssetClass =
    | "stock" | "bond" | "etf" | "mutual_fund"
    | "commodity" | "gold" | "futures" | "options" | "bitcoin";

export interface Asset {
    // Common properties for all assets
    id: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    type?: string;

    // Optional properties - These must exist here to be allowed in your objects
    marketCap?: string;    // Used by Stocks, ETFs, Bitcoin
    yield?: string;        // Used by Bonds
    expiry?: string;       // Used by Futures, Options
    strike?: number;       // Used by Options
    openInterest?: string; // Used by Futures, Options
    sector?: string;       // Used by Stocks
}


export type TransactionStatus = "completed" | "pending" | "failed";
export type KYCStatus = "verified" | "pending" | "rejected" | "not_started";
export type AccountType = "personal" | "business";

export interface Investment {
    id: string;
    assetId: string;
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    change: number;
    changePercent: number;
    purchaseDate: string;
    portfolioType: "Growth" | "Retirement" | "Aggressive";
    performanceHistory: { date: string; value: number; gain: number }[];
}

export interface StockTransfer {
    id: string;
    assetSymbol: string;
    assetName: string;
    shares: number;
    valueAtTransfer: number;
    fromUser: string;
    toUser: string;
    date: string;
    status: "completed" | "pending" | "rejected";
    type: "inbound" | "outbound";
}

export interface CashMovement {
    id: string;
    type: "deposit" | "withdrawal";
    amount: number;
    currency: string;
    method: string;
    status: TransactionStatus;
    date: string;
}

export interface ConnectedAccount {
    id: string;
    provider: string;
    accountName: string;
    lastFour: string;
    balance: number;
}

export interface User {
    id: string;
    profile: {
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
        address: string;
        country: string;
        phoneNumber: string;
    };
    settings: {
        accountType: AccountType;
        kycStatus: KYCStatus;
        riskTolerance: "conservative" | "moderate" | "aggressive";
        baseCurrency: string;
    };
    portfolios: {
        id: string;
        name: string;
        holdings: Investment[];
    }[];
    cashMovements: CashMovement[];
    connectedAccounts: ConnectedAccount[];
    stockTransfers: StockTransfer[]; // Fixed: Added to interface
    totalBalance: number;
    availableCash: number;
}
