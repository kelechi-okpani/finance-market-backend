import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { getStockQuotes } from "@/lib/marketstack";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/portfolios/[id] - Get portfolio with holdings and live data
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

        // Get all holdings for this portfolio
        const holdings = await Holding.find({ portfolioId: id });

        // Fetch live prices for all symbols in this portfolio
        const symbols = holdings.map(h => h.symbol);
        let liveData = new Map();

        if (symbols.length > 0) {
            liveData = await getStockQuotes(symbols);
        }

        // Merge live data with holdings
        const holdingsWithLivePrice = holdings.map(h => {
            const live = liveData.get(h.symbol);
            const currentPrice = live?.price || h.avgBuyPrice;
            const value = currentPrice * h.shares;
            const gainLoss = value - (h.avgBuyPrice * h.shares);
            const gainLossPercent = ((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100;

            return {
                ...h.toObject(),
                currentPrice,
                value,
                gainLoss,
                gainLossPercent,
            };
        });

        // Calculate portfolio totals
        const totalValue = holdingsWithLivePrice.reduce((sum, h) => sum + h.value, 0);
        const totalCost = holdings.reduce((sum, h) => sum + (h.avgBuyPrice * h.shares), 0);
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        return corsResponse({
            portfolio,
            holdings: holdingsWithLivePrice,
            summary: {
                totalValue,
                totalCost,
                totalGainLoss,
                totalGainLossPercent,
            },
        }, 200, origin);
    } catch (error) {
        console.error("Get portfolio detail error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// PUT /api/portfolios/[id] - Update portfolio details
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, status, type } = body;

        await connectDB();

        const portfolio = await Portfolio.findOneAndUpdate(
            { _id: id, userId: auth.user!._id },
            {
                $set: {
                    ...(name && { name: name.trim() }),
                    ...(description !== undefined && { description: description.trim() }),
                    ...(status && { status }),
                    ...(type && { type }),
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

// DELETE /api/portfolios/[id] - Delete portfolio and all its holdings
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

        // Delete all holdings in this portfolio
        await Holding.deleteMany({ portfolioId: id });

        return corsResponse({ message: "Portfolio and its holdings deleted successfully." }, 200, origin);
    } catch (error) {
        console.error("Delete portfolio error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
