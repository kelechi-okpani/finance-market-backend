import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/portfolios/[id]/holdings - Add a new holding to a portfolio
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id: portfolioId } = await params;
        const body = await request.json();
        const { symbol, companyName, shares, avgBuyPrice, targetReturn } = body;

        // Validate input
        if (!symbol || !companyName || shares === undefined || avgBuyPrice === undefined) {
            return corsResponse(
                { error: "Symbol, company name, shares, and buy price are required." },
                400,
                origin
            );
        }

        await connectDB();

        // Verify portfolio exists and belongs to user
        const portfolio = await Portfolio.findOne({
            _id: portfolioId,
            userId: auth.user!._id,
        });

        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found." }, 404, origin);
        }

        // Check if user already has this symbol in this portfolio
        let holding = await Holding.findOne({ portfolioId, symbol: symbol.toUpperCase() });

        const Stock = (await import("@/lib/models/Stock")).default;
        const stockData = await Stock.findOne({ symbol: symbol.toUpperCase().trim() });

        if (holding) {
            // Average out the price and sum the shares
            const totalCost = (holding.shares * holding.avgBuyPrice) + (shares * avgBuyPrice);
            const totalShares = holding.shares + shares;

            holding.avgBuyPrice = totalCost / totalShares;
            holding.shares = totalShares;
            if (targetReturn !== undefined) holding.targetReturn = targetReturn;
            
            // Sync snapshot if possible
            if (stockData) {
                holding.name = stockData.name;
                holding.price = stockData.price;
                holding.change = stockData.change;
                holding.changePercent = stockData.changePercent;
                holding.volume = stockData.volume;
                holding.marketCap = stockData.marketCap;
                holding.peRatio = stockData.peRatio;
                holding.dividend = stockData.dividend;
                holding.marketTrend = stockData.marketTrend;
                holding.description = stockData.description;
                holding.market = stockData.market;
            }

            await holding.save();
        } else {
            // Create new holding
            holding = await Holding.create({
                portfolioId,
                userId: auth.user!._id,
                symbol: symbol.toUpperCase().trim(),
                companyName: companyName.trim(),
                name: stockData?.name || companyName.trim(),
                shares,
                avgBuyPrice,
                targetReturn,
                // Market snapshot
                market: stockData?.market,
                price: stockData?.price,
                change: stockData?.change,
                changePercent: stockData?.changePercent,
                volume: stockData?.volume,
                marketCap: stockData?.marketCap,
                peRatio: stockData?.peRatio,
                dividend: stockData?.dividend,
                marketTrend: stockData?.marketTrend,
                description: stockData?.description
            });
        }

        return corsResponse(
            { message: "Holding added successfully.", holding },
            201,
            origin
        );
    } catch (error) {
        console.error("Add holding error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
