import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import Transaction from "@/lib/models/Transaction";
import { getAuthUser } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { getStockQuotes } from "@/lib/marketstack";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/user/data
 * Unified endpoint for fetching Investment, Transaction, and Portfolio data.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const user = await getAuthUser(request);
        if (!user) {
            return corsResponse({ error: "Unauthorized. Please log in." }, 401, origin);
        }

        await connectDB();

        // 1. Fetch Portfolios, Holdings, and Transactions in parallel
        const [portfolios, holdings, transactions] = await Promise.all([
            Portfolio.find({ userId: user._id }).lean(),
            Holding.find({ userId: user._id }).lean(),
            Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).lean()
        ]);

        // 2. Enrich Holdings with live prices
        const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
        let liveData = new Map();
        if (symbols.length > 0) {
            try {
                liveData = await getStockQuotes(symbols);
            } catch (err) {
                console.warn("Live quotes failed, using last known purchase price.");
            }
        }

        const enrichedHoldings = holdings.map(h => {
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
                performanceHistory: [
                    { date: h.boughtAt?.toISOString().split("T")[0] || "", value: cost, gain: 0 },
                    { date: new Date().toISOString().split("T")[0], value, gain: change }
                ]
            };
        });

        // 3. Assemble the response
        return corsResponse({
            Portfolio: portfolios.map(p => ({
                id: p._id.toString(),
                name: p.name,
                holdings: enrichedHoldings.filter(h => holdings.find(oh => oh._id.toString() === h.id)?.portfolioId?.toString() === p._id.toString())
            })),
            Investment: enrichedHoldings,
            Transaction: transactions.map(t => ({
                id: t._id.toString(),
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: t.createdAt
            }))
        }, 200, origin);

    } catch (err: any) {
        console.error("User data API error:", err);
        return corsResponse({ error: "Failed to fetch user data", details: err.message }, 500, origin);
    }
}
