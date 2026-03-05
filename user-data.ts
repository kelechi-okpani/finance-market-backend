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

const generatePerformance = (baseValue: number, days: number) => {
    return Array.from({ length: days }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        const randomVariation = 1 + (Math.random() * 0.1 - 0.04);
        const val = baseValue * randomVariation;
        return {
            date: date.toISOString().split("T")[0],
            value: val,
            gain: val * 0.15,
        };
    });
};

export const mockUsers: User[] = [
    {
        id: "usr_01",
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
        portfolios: [
            {
                id: "p1",
                name: "Main Growth Portfolio",
                holdings: [
                    {
                        id: "inv_01",
                        assetId: "s5",
                        symbol: "NVDA",
                        name: "NVIDIA Corp.",
                        shares: 25,
                        avgPrice: 420.5,
                        currentPrice: 726.13,
                        value: 18153.25,
                        change: 7640.75,
                        changePercent: 72.6,
                        purchaseDate: "2023-11-12",
                        portfolioType: "Growth",
                        performanceHistory: generatePerformance(18000, 30),
                    },
                    {
                        id: "inv_02",
                        assetId: "btc1",
                        symbol: "BTC",
                        name: "Bitcoin",
                        shares: 0.45,
                        avgPrice: 42000.0,
                        currentPrice: 90681.0,
                        value: 40806.45,
                        change: 21906.45,
                        changePercent: 115.9,
                        purchaseDate: "2024-01-05",
                        portfolioType: "Aggressive",
                        performanceHistory: generatePerformance(40000, 30),
                    },
                ],
            },
        ],
        cashMovements: [
            {
                id: "tx_01",
                type: "deposit",
                amount: 25000.0,
                currency: "EUR",
                method: "SEPA Transfer",
                status: "completed",
                date: "2024-02-15T10:30:00Z",
            },
            {
                id: "tx_02",
                type: "withdrawal",
                amount: 5000.0,
                currency: "EUR",
                method: "Bank Account (...4492)",
                status: "completed",
                date: "2024-02-18T14:20:00Z",
            },
            {
                id: "tx_03",
                type: "deposit",
                amount: 1200.0,
                currency: "EUR",
                method: "Visa Card",
                status: "pending",
                date: "2024-02-22T09:00:00Z",
            },
        ],
        connectedAccounts: [
            {
                id: "conn_01",
                provider: "Deutsche Bank",
                accountName: "Primary Checking",
                lastFour: "8821",
                balance: 14200.5,
            },
            {
                id: "conn_02",
                provider: "Coinbase",
                accountName: "Hot Wallet",
                lastFour: "0x4F",
                balance: 2450.0,
            },
        ],
        stockTransfers: [ // Fixed name and structure
            {
                id: "st_99",
                assetSymbol: "NVDA",
                assetName: "NVIDIA Corp.",
                shares: 5,
                valueAtTransfer: 3630.65,
                fromUser: "Julian Bernhardt",
                toUser: "Internal Liquidity Pool",
                date: "2024-02-21T09:00:00Z",
                status: "completed",
                type: "outbound"
            },
            {
                id: "st_98",
                assetSymbol: "BTC",
                assetName: "Bitcoin",
                shares: 0.1,
                valueAtTransfer: 9068.10,
                fromUser: "External Wallet (0x...f3)",
                toUser: "Julian Bernhardt",
                date: "2024-02-19T16:45:00Z",
                status: "completed",
                type: "inbound"
            }
        ],
        totalBalance: 58959.7,
        availableCash: 4250.25,
    },
];