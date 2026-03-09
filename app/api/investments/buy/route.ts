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

        // 3. Create Transaction (ledger)
        const transaction = await Transaction.create({
            userId: user._id,
            type: 'buy',
            amount: totalCost,
            description: `Bought ${shares} shares of ${symbol} at $${price}`,
            referenceId: symbol,
        });

        // 4. Update or Create Holding
        const existingHolding = await Holding.findOne({
            userId: user._id,
            portfolioId: targetPortfolioId,
            symbol: symbol.toUpperCase()
        });

        if (existingHolding) {
            const newTotalShares = existingHolding.shares + shares;
            const newAvgPrice = ((existingHolding.avgBuyPrice * existingHolding.shares) + (price * shares)) / newTotalShares;

            existingHolding.shares = newTotalShares;
            existingHolding.avgBuyPrice = newAvgPrice;
            await existingHolding.save();
        } else {
            await Holding.create({
                userId: user._id,
                portfolioId: targetPortfolioId,
                symbol: symbol.toUpperCase(),
                companyName: companyName || symbol,
                shares,
                avgBuyPrice: price,
                boughtAt: new Date(),
            });
        }

        // 5. Update User Balance (Deduct from available cash)
        await User.findByIdAndUpdate(user._id, {
            $inc: {
                availableCash: -totalCost
                // totalBalance is usually sum of all assets + cash, 
                // but since totalBalance field exists in User model, we keep it as "Net Worth" or "Cash + Assets"
                // If totalBalance includes assets, it doesn't change on buy (just moves from cash to stock). 
                // But often it's "Wallet Balance". Let's update it accordingly.
            }
        });

        return corsResponse({
            message: `Successfully bought ${shares} shares of ${symbol}.`,
            transaction
        }, 201, origin);

    } catch (error) {
        console.error("Buy Stock API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
