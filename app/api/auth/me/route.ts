import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import CashMovement from "@/lib/models/CashMovement";
import ConnectedAccount from "@/lib/models/ConnectedAccount";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer"; 
import SettlementAccount from "@/lib/models/SettlementAccount";
import TradeRequest from "@/lib/models/TradeRequest";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAuth(request);
        // Safety Check: requireAuth should return an error object if unauthorized
        if (auth.error || !auth.user) {
            return auth.error || corsResponse({ error: "Unauthorized access." }, 401, origin);
        }
        
        const user = auth.user;

        await connectDB();

        // Use a single Promise.all to fetch everything concurrently
        // Note: Added .lean() to all for massive performance gains on dashboard loads
        const [
            portfolios, 
            cashMovements, 
            connectedAccounts, 
            transfers, 
            settlementAccounts,
            tradeRequests
        ] = await Promise.all([
            Portfolio.find({ userId: user._id }).lean(),
            CashMovement.find({ userId: user._id }).sort({ date: -1 }).lean(),
            ConnectedAccount.find({ userId: user._id }).lean(),
            PortfolioTransfer.find({ senderId: user._id }).sort({ createdAt: -1 }).lean(),
            SettlementAccount.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
            TradeRequest.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
        ]);

        // Process Portfolios safely
        const formattedPortfolios = (portfolios || []).map((p: any) => {
            const assets = (p.assets || []).map((a: any) => ({
                ...a,
                value: (Number(a.shares) || 0) * (Number(a.averagePrice) || 0),
            }));

            return {
                id: p._id.toString(),
                name: p.name,
                status: p.status,
                baseCurrency: p.baseCurrency,
                assets: assets,
                totalValue: assets.reduce((sum:any, a:any) => sum + a.value, 0),
                totalInvested: p.totalInvested || 0
            };
        });

        const totalInvestedCapital = formattedPortfolios.reduce((sum, p) => sum + p.totalInvested, 0);
        const kycStatus = user.kycVerified ? "verified" : (user.kycStatus || "not_started");
        // NEW: Calculate Total Withdrawals from the lean cashMovements result
        const totalWithdrawals = (cashMovements || [])
            .filter((cm: any) => cm.type === "withdrawal" && cm.status === "completed") // Adjust "type" and "status" to match your schema
            .reduce((sum: number, cm: any) => sum + (Number(cm.amount) || 0), 0);

        // Construct the final payload
        const payload = {
            user: {
                id: user._id.toString(),
                profile: {
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",
                    avatar: user.headshotUrl || user.avatar || "",
                    phone: user.phone || "",
                    sex: user.sex || "",
                    occupation: user.occupation || "",
                },
                financials: {
                    totalBalance: user.totalBalance || 0,
                    availableCash: user.availableCash || 0,
                    totalWithdrawals: totalWithdrawals,
                    investedCapital: totalInvestedCapital,
                },
                portfolios: formattedPortfolios,
                tradeRequests: (tradeRequests || []).map((tr: any) => ({ ...tr, id: tr._id.toString() })),
                cashMovements: (cashMovements || []).map((cm: any) => ({ ...cm, id: cm._id.toString() })),
                connectedAccounts: (connectedAccounts || []).map((ca: any) => ({ ...ca, id: ca._id.toString() })),
                portfolioTransfers: (transfers || []).map((t: any) => ({ ...t, id: t._id.toString() })),
                settlementAccounts: (settlementAccounts || []).map((sa: any) => ({ ...sa, id: sa._id.toString() })),
                settings: {
                    accountType: user.accountType || "individual",
                    kycStatus,
                    riskTolerance: user.riskTolerance || "moderate",
                    baseCurrency: user.baseCurrency || "USD",
                },
                investorCode: user.investorCode,
                onboardingStep: user.onboardingStep,
                status: user.status,
                accountStatus: user.accountStatus,
                role: user.role,
                agreementSigned: user.agreementSigned,
                createdAt: user.createdAt
            }
        };

        return corsResponse(payload, 200, origin);

    } catch (error: any) {
        // Detailed logging to help you find the exact model that might be failing
        console.error("CRITICAL API FAILURE [auth/me]:", error.message);
        return corsResponse({ error: "Internal Server Error", details: error.message }, 500, origin);
    }
}