import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import Holding from "@/lib/models/Holding";
import Portfolio from "@/lib/models/Portfolio";
import User from "@/lib/models/User";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { symbol, companyName, shares, price, portfolioId } = body;

        if (!symbol || !shares || !price) {
            return corsResponse({ error: "Symbol, shares, and price are required." }, 400, origin);
        }

        const totalCost = shares * price;

        await connectDB();

        // 1. Check user balance
        const user = await User.findById(auth.user!._id);
        if (!user || user.availableCash < totalCost) {
            return corsResponse({ error: "Insufficient available cash to buy this stock." }, 400, origin);
        }

        // 2. Resolve or Create Portfolio
        let targetPortfolioId = portfolioId;
        if (!targetPortfolioId) {
            let defaultPortfolio = await Portfolio.findOne({ userId: user._id, name: "Main Portfolio" });
            if (!defaultPortfolio) {
                defaultPortfolio = await Portfolio.create({
                    userId: user._id,
                    name: "Main Portfolio",
                    type: "stocks",
                    status: "active",
                    source: "created"
                });
            }
            targetPortfolioId = defaultPortfolio._id;
        }

        // 3. Create Trade Request (Pending Admin Approval)
        const TradeRequest = (await import("@/lib/models/TradeRequest")).default;
        const Stock = (await import("@/lib/models/Stock")).default;
        const stockData = await Stock.findOne({ symbol: symbol.toUpperCase() });

        const tradeReq = await TradeRequest.create({
            userId: user._id,
            type: "buy",
            symbol: symbol.toUpperCase(),
            companyName: companyName || stockData?.name || symbol,
            sector: stockData?.sector || "Stocks",
            shares: shares,
            pricePerShare: price,
            totalAmount: totalCost,
            portfolioId: targetPortfolioId,
            status: "pending"
        });

        // 4. Create Transaction (ledger for the request)
        const transaction = await Transaction.create({
            userId: user._id,
            type: 'buy',
            amount: totalCost,
            description: `Trade Request (Pending): Buy ${shares} shares of ${symbol} at $${price}`,
            referenceId: symbol,
        });

        // 5. Update User Balance (Deduct from available cash immediately)
        user.availableCash -= totalCost;
        await user.save();

        return corsResponse({
            message: `Trade request for ${shares} shares of ${symbol} submitted for Admin approval. $${totalCost} has been deducted from your wallet.`,
            transaction,
            requestId: tradeReq._id,
            availableCash: user.availableCash
        }, 201, origin);

    } catch (error) {
        console.error("Buy Stock API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
