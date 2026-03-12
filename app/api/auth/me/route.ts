import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import CashMovement from "@/lib/models/CashMovement";
import ConnectedAccount from "@/lib/models/ConnectedAccount";
import StockTransfer from "@/lib/models/StockTransfer";
import Transaction from "@/lib/models/Transaction";
import { getAuthUser } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { getStockQuotes } from "@/lib/marketstack";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/auth/me - Get current user profile (nested shape matching frontend User type)
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const user = await getAuthUser(request);

        if (!user) {
            return corsResponse(
                { error: "Unauthorized. Please log in." },
                401,
                origin
            );
        }

        await connectDB();

        // Fetch all related data in parallel
        const [portfolios, holdings, cashMovements, connectedAccounts, stockTransfers, transactions] =
            await Promise.all([
                Portfolio.find({ userId: user._id }),
                Holding.find({ userId: user._id }),
                CashMovement.find({ userId: user._id }).sort({ date: -1 }),
                ConnectedAccount.find({ userId: user._id }),
                StockTransfer.find({ userId: user._id }).sort({ date: -1 }),
                Transaction.find({ userId: user._id }),
            ]);

        // Get live prices for holdings
        const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
        let liveData = new Map();
        if (symbols.length > 0) {
            try {
                liveData = await getStockQuotes(symbols);
            } catch {
                // If live data fails, we continue with avgBuyPrice as fallback
            }
        }

        // Calculate balances from transactions
        const totalDeposits = transactions
            .filter(t => t.type === "deposit" || t.type === "sell")
            .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = transactions
            .filter(t => t.type === "withdrawal" || t.type === "buy")
            .reduce((sum, t) => sum + t.amount, 0);
        const computedBalance = totalDeposits - totalWithdrawals;

        // Use stored balance or computed balance
        const totalBalance = user.totalBalance || computedBalance;
        const availableCash = user.availableCash || computedBalance;

        // Build portfolios with holdings (Investment type)
        const portfoliosWithHoldings = portfolios.map(p => {
            const pHoldings = holdings
                .filter(h => h.portfolioId.toString() === p._id.toString())
                .map(h => {
                    const live = liveData.get(h.symbol);
                    const currentPrice = live?.price || h.avgBuyPrice;
                    const value = currentPrice * h.shares;
                    const cost = h.avgBuyPrice * h.shares;
                    const change = value - cost;
                    const changePercent = cost > 0 ? (change / cost) * 100 : 0;

                    return {
                        id: h._id.toString(),
                        assetId: h._id.toString(),
                        symbol: h.symbol,
                        name: h.name || h.companyName,
                        companyName: h.companyName,
                        sector: h.sector || "",
                        shares: h.shares,
                        avgPrice: h.avgBuyPrice,
                        currentPrice,
                        value,
                        change: live ? (value - cost) : (h.change || 0),
                        changePercent: live ? (cost > 0 ? ((value - cost) / cost) * 100 : 0) : (h.changePercent || 0),
                        
                        // Market data parity fields
                        market: h.market || "Unknown",
                        volume: h.volume || "0",
                        marketCap: h.marketCap || "0",
                        peRatio: h.peRatio,
                        dividend: h.dividend,
                        marketTrend: h.marketTrend || "neutral",
                        description: h.description || "",

                        purchaseDate: h.boughtAt?.toISOString().split("T")[0] || "",
                        portfolioType: p.name.includes("Growth") ? "Growth" :
                            p.name.includes("Retire") ? "Retirement" : "Aggressive",
                        performanceHistory: [
                            { date: h.boughtAt?.toISOString().split("T")[0] || "", value: cost, gain: 0 },
                            { date: new Date().toISOString().split("T")[0], value, gain: change },
                        ],
                    };
                });

            return {
                id: p._id.toString(),
                name: p.name,
                holdings: pHoldings,
            };
        });

        // Build CashMovement[] response
        const cashMovementsResponse = cashMovements.map(cm => ({
            id: cm._id.toString(),
            type: cm.type,
            amount: cm.amount,
            currency: cm.currency,
            method: cm.method,
            status: cm.status,
            date: cm.date,
        }));

        // Build ConnectedAccount[] response
        const connectedAccountsResponse = connectedAccounts.map(ca => ({
            id: ca._id.toString(),
            provider: ca.provider,
            accountName: ca.accountName,
            lastFour: ca.lastFour,
            balance: ca.balance,
        }));

        // Build StockTransfer[] response
        const stockTransfersResponse = stockTransfers.map(st => ({
            id: st._id.toString(),
            assetSymbol: st.assetSymbol,
            assetName: st.assetName,
            shares: st.shares,
            valueAtTransfer: st.valueAtTransfer,
            fromUser: st.fromUser,
            toUser: st.toUser,
            date: st.date,
            status: st.status,
            type: st.type,
        }));

        // Determine KYC status
        const kycStatus = user.kycVerified ? "verified" :
            user.kycStatus || (user.status === "onboarding" ? "pending" : "not_started");

        // Build the nested User response
        return corsResponse(
            {
                user: {
                    id: user._id.toString(),
                    profile: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        avatar: user.headshotUrl || user.avatar || "",
                        address: user.address || "",
                        country: user.country || "",
                        phoneNumber: user.phone || "",
                    },
                    settings: {
                        accountType: user.accountType || "individual",
                        kycStatus,
                        riskTolerance: user.riskTolerance || "moderate",
                        baseCurrency: user.baseCurrency || "USD",
                    },
                    portfolios: portfoliosWithHoldings,
                    cashMovements: cashMovementsResponse,
                    connectedAccounts: connectedAccountsResponse,
                    stockTransfers: stockTransfersResponse,
                    totalBalance,
                    availableCash,
                    failedWithdrawalAttempts: user.failedWithdrawalAttempts || 0,
                    requiresResettlementAccount: user.requiresResettlementAccount || false,

                    // Legacy fields for backward compatibility
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                    sex: user.sex,
                    investorCode: user.investorCode,
                    accountCategory: user.accountCategory,
                    onboardingStep: user.onboardingStep,
                    headshotUrl: user.headshotUrl,
                    kycVerified: user.kycVerified,
                    isApproved: user.status === "approved" || user.status === "onboarding",
                    isKyc: user.kycVerified || user.onboardingStep >= 16,
                    accountStatus: user.accountStatus || "pending",
                    agreementSigned: user.agreementSigned,
                    createdAt: user.createdAt,
                },
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Auth me error:", error);
        return corsResponse(
            { error: "Internal server error. Please try again later." },
            500,
            origin
        );
    }
}
