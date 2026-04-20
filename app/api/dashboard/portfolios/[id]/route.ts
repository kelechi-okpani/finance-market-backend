import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import MarketItem from "@/lib/models/financeStock";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET: Fetch a single portfolio and calculate real-time performance from embedded assets.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        const portfolio = await Portfolio.findOne({
            _id: id,
            userId: auth.user!._id,
        });

        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found." }, 404, origin);
        }

        // 1. Fetch current market prices for all embedded assets
        const symbols = portfolio.assets.map((a: any) => a.symbol);
        const currentMarketPrices = await MarketItem.find({ 
            symbol: { $in: symbols } 
        }).select("symbol price change change_percent");

        const priceMap = new Map(currentMarketPrices.map(m => [m.symbol, m]));

        // 2. Merge Live Data and Calculate Metrics
        const assetsWithMetrics = portfolio.assets.map((asset: any) => {
            const marketData = priceMap.get(asset.symbol);
            const currentPrice = marketData?.price || asset.averagePrice;
            
            const currentValue = currentPrice * asset.shares;
            const costBasis = asset.averagePrice * asset.shares;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = asset.averagePrice > 0 
                ? ((currentPrice - asset.averagePrice) / asset.averagePrice) * 100 
                : 0;

            return {
                ...asset,
                currentPrice,
                currentValue,
                gainLoss,
                gainLossPercent,
                dailyChange: marketData?.change || 0
            };
        });

        // 3. Calculate Portfolio-wide Summary
        const totalValue = assetsWithMetrics.reduce((sum, a) => sum + a.currentValue, 0);
        const totalCost = portfolio.assets.reduce((sum, a) => sum + (a.averagePrice * a.shares), 0);
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        return corsResponse({
            portfolio: {
                ...portfolio.toObject(),
                assets: assetsWithMetrics
            },
            summary: {
                totalValue,
                totalCost,
                totalGainLoss,
                totalGainLossPercent,
                currency: portfolio.baseCurrency
            },
        }, 200, origin);

    } catch (error) {
        console.error("Get portfolio detail error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

/**
 * PUT: Update Portfolio metadata
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const { name, description, status } = await request.json();

        await connectDB();

        const portfolio = await Portfolio.findOneAndUpdate(
            { _id: id, userId: auth.user!._id },
            {
                $set: {
                    ...(name && { name: name.trim() }),
                    ...(description !== undefined && { description: description.trim() }),
                    ...(status && { status }),
                }
            },
            { new: true }
        );

        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found." }, 404, origin);
        }

        return corsResponse({ message: "Portfolio updated successfully.", portfolio }, 200, origin);
    } catch (error) {
        console.error("Update portfolio error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

/**
 * DELETE: Remove portfolio (Assets are automatically removed as they are embedded)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        const portfolio = await Portfolio.findOneAndDelete({
            _id: id,
            userId: auth.user!._id,
        });

        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found." }, 404, origin);
        }

        // Clean up is automatic! No need for Holding.deleteMany()
        return corsResponse({ message: "Portfolio and embedded assets removed." }, 200, origin);
    } catch (error) {
        console.error("Delete portfolio error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}