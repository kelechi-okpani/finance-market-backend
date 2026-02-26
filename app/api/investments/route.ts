import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Holding from "@/lib/models/Holding";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { getStockQuotes } from "@/lib/marketstack";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/investments - Get all user holdings across all portfolios
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const holdings = await Holding.find({ userId: auth.user!._id }).populate('portfolioId', 'name');

        const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
        let liveData = new Map();

        if (symbols.length > 0) {
            liveData = await getStockQuotes(symbols);
        }

        const holdingsWithLivePrice = holdings.map(h => {
            const live = liveData.get(h.symbol);
            const currentPrice = live?.price || h.avgBuyPrice;
            const value = currentPrice * h.shares;
            const cost = h.avgBuyPrice * h.shares;
            const gainLoss = value - cost;
            const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

            return {
                ...h.toObject(),
                currentPrice,
                value,
                cost,
                gainLoss,
                gainLossPercent,
            };
        });

        const totalInvested = holdingsWithLivePrice.reduce((sum, h) => sum + h.cost, 0);
        const totalValue = holdingsWithLivePrice.reduce((sum, h) => sum + h.value, 0);
        const totalGainLoss = totalValue - totalInvested;
        const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        return corsResponse({
            holdings: holdingsWithLivePrice,
            summary: {
                totalInvested,
                totalValue,
                totalGainLoss,
                totalGainLossPercent,
                avgProjected: 12.0, // Static for demo
                avgDuration: "3 mo" // Static for demo
            }
        }, 200, origin);
    } catch (error) {
        console.error("Investments API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
