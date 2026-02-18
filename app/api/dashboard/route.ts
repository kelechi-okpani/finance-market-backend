import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { getStockQuotes } from "@/lib/marketstack";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/dashboard - Aggregated dashboard overview
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const [portfolios, holdings] = await Promise.all([
            Portfolio.find({ userId: auth.user!._id }),
            Holding.find({ userId: auth.user!._id })
        ]);

        const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
        let liveData = new Map();

        if (symbols.length > 0) {
            liveData = await getStockQuotes(symbols);
        }

        const totalCost = holdings.reduce((sum, h) => sum + (h.avgBuyPrice * h.shares), 0);
        const totalValue = holdings.reduce((sum, h) => {
            const currentPrice = liveData.get(h.symbol)?.price || h.avgBuyPrice;
            return sum + (currentPrice * h.shares);
        }, 0);

        const change24h = 9.57; // Static for demo as seen on frontend

        return corsResponse({
            stats: {
                totalAssets: totalValue,
                change24h,
                activePortfolios: portfolios.length,
                holdingsCount: holdings.length
            },
            portfolios: portfolios.map(p => {
                // Find holdings for this portfolio to calc value
                const pHoldings = holdings.filter(h => h.portfolioId.toString() === p._id.toString());
                const pValue = pHoldings.reduce((sum, h) => {
                    const currentPrice = liveData.get(h.symbol)?.price || h.avgBuyPrice;
                    return sum + (currentPrice * h.shares);
                }, 0);
                const pCost = pHoldings.reduce((sum, h) => sum + (h.avgBuyPrice * h.shares), 0);
                const pChange = pCost > 0 ? ((pValue - pCost) / pCost) * 100 : 0;

                return {
                    ...p.toObject(),
                    value: pValue,
                    change: pChange
                };
            })
        }, 200, origin);
    } catch (error) {
        console.error("Dashboard API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
