import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import Holding from "@/lib/models/Holding";
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
        const { symbol, shares, price, holdingId } = body;

        if ((!symbol && !holdingId) || !shares || !price) {
            return corsResponse({ error: "Symbol or HoldingId, shares, and price are required." }, 400, origin);
        }

        await connectDB();

        // 1. Find the holding
        const query = holdingId ? { _id: holdingId, userId: auth.user!._id } : { symbol: symbol.toUpperCase(), userId: auth.user!._id };
        const holding = await Holding.findOne(query);

        if (!holding || holding.shares < shares) {
            return corsResponse({ error: "Insufficient shares to sell." }, 400, origin);
        }

        const totalProceeds = shares * price;

        // 2. Create Transaction (ledger)
        const transaction = await Transaction.create({
            userId: auth.user!._id,
            type: 'sell',
            amount: totalProceeds,
            description: `Sold ${shares} shares of ${holding.symbol} at $${price}`,
            referenceId: holding.symbol,
        });

        // 3. Update or Remove Holding
        if (holding.shares === shares) {
            await Holding.deleteOne({ _id: holding._id });
        } else {
            holding.shares -= shares;
            await holding.save();
        }

        // 4. Update User Balance (Add to available cash)
        await User.findByIdAndUpdate(auth.user!._id, {
            $inc: {
                availableCash: totalProceeds
            }
        });

        return corsResponse({
            message: `Successfully sold ${shares} shares of ${holding.symbol}.`,
            transaction
        }, 201, origin);

    } catch (error) {
        console.error("Sell Stock API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
