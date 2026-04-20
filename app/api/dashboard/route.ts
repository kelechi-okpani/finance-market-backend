import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import TradeRequest from "@/lib/models/TradeRequest";
import CashMovement from "@/lib/models/CashMovement";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import MarketItem from "@/lib/models/financeStock"; 
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error || !auth.user) {
        return auth.error || corsResponse({ error: "Unauthorized" }, 401, origin);
    }

    try {
        await connectDB();

        // 1. Handle Non-Approved State
        if (auth.user.status !== "approved") {
            const OnboardingProgress = (await import("@/lib/models/OnboardingProgress")).default;
            const progress = await OnboardingProgress.findOne({ userId: auth.user._id });

            return corsResponse({
                locked: true,
                status: auth.user.status,
                onboardingStep: auth.user.onboardingStep || 1,
                progress: progress || { currentStep: 1, completedSteps: [] },
                message: "Your account is under review.",
                summary: {
                    fullName: `${auth.user.firstName} ${auth.user.lastName}`,
                    email: auth.user.email,
                    kycVerified: auth.user.kycVerified || false,
                    agreementSigned: auth.user.agreementSigned || false,
                    hasProfilePicture: !!auth.user.headshotUrl,
                }
            }, 200, origin);
        }

        // 2. Fetch Data (Removed 'holdings' fetch - now using embedded 'portfolios.assets')
        const userId = auth.user._id;
        const [portfolios, pendingTrades, pendingCash, sentTransfers, activeMarkets] = await Promise.all([
            Portfolio.find({ userId }).lean(), // Use lean for speed
            TradeRequest.find({ userId, status: "pending" }).lean(),
            CashMovement.find({ userId, status: "pending" }).lean(),
            PortfolioTransfer.find({ senderId: userId, status: "pending" }).lean(),
            MarketItem.find({ isActive: true }).select("symbol price lastPrice").lean()
        ]);

        // 3. Create Price Map for O(1) lookup
        const marketPriceMap = new Map(
            activeMarkets.map((item: any) => [item.symbol.toUpperCase(), item.lastPrice || item.price || 0])
        );

        let globalTotalValue = 0;
        let globalTotalHoldingsCount = 0;

        // 4. Map Portfolios and calculate values from embedded assets
        const portfolioData = portfolios.map((p: any) => {
            const assets = p.assets || [];
            globalTotalHoldingsCount += assets.length;

            // Calculate Portfolio Value based on Market Prices
            const pCurrentValue = assets.reduce((sum: number, asset: any) => {
                const currentPrice = marketPriceMap.get(asset.symbol.toUpperCase()) || asset.averagePrice;
                return sum + (currentPrice * asset.shares);
            }, 0);

            // Use the stored totalInvested for performance percentage
            const pCost = p.totalInvested || 0;
            const pChange = pCost > 0 ? ((pCurrentValue - pCost) / pCost) * 100 : 0;
            
            globalTotalValue += pCurrentValue;

            return {
                id: p._id.toString(),
                name: p.name,
                status: p.status,
                currentValue: pCurrentValue,
                totalInvested: pCost,
                performancePercentage: pChange,
                holdingsCount: assets.length,
                assets: assets // Include embedded assets for frontend mapping
            };
        });

        // 5. Final Dashboard Payload
        return corsResponse({
            locked: false,
            stats: {
                totalAssets: globalTotalValue,
                availableCash: auth.user.availableCash || 0,
                activePortfolios: portfolios.length,
                holdingsCount: globalTotalHoldingsCount
            },
            portfolios: portfolioData,
            activeMarket: activeMarkets.slice(0, 10), // Limit to avoid massive payload
            pending: {
                trades: pendingTrades,
                cash: pendingCash,
                transfers: sentTransfers
            },
            user: {
                firstName: auth.user.firstName,
                lastName: auth.user.lastName,
                status: auth.user.status,
                headshotUrl: auth.user.headshotUrl
            }
        }, 200, origin);

    } catch (error: any) {
        console.error("Dashboard API error:", error);
        return corsResponse({ 
            error: "Internal server error.", 
            details: error.message 
        }, 500, origin);
    }
}