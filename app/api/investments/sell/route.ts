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

        // 2. Create Trade Request (Pending Admin Approval)
        const TradeRequest = (await import("@/lib/models/TradeRequest")).default;
        
        const tradeReq = await TradeRequest.create({
            userId: auth.user!._id,
            type: "sell",
            symbol: holding.symbol,
            companyName: holding.companyName,
            sector: holding.sector,
            shares: shares,
            pricePerShare: price,
            totalAmount: totalProceeds,
            portfolioId: holding.portfolioId,
            holdingId: holding._id,
            status: "pending"
        });

        return corsResponse({
            message: `Sell request for ${shares} shares of ${holding.symbol} submitted for Admin approval.`,
            requestId: tradeReq._id
        }, 201, origin);

    } catch (error) {
        console.error("Sell Stock API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
