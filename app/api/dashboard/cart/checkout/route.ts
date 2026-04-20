import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import CartItem from "@/lib/models/CartItem";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import TradeRequest from "@/lib/models/TradeRequest";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    return corsOptionsResponse(origin);
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // 1. Fetch Cart Items
        const cartItems = await CartItem.find({ userId: auth.user!._id });
        if (cartItems.length === 0) {
            return corsResponse({ error: "Cart is empty" }, 400, origin);
        }

        // 2. Validation Loop
        for (const item of cartItems) {
            const portfolio = await Portfolio.findOne({ 
                _id: item.portfolioId, 
                userId: auth.user!._id 
            });

            if (!portfolio || portfolio.status !== 'active') {
                return corsResponse({ error: `Portfolio for ${item.symbol} is invalid.` }, 400, origin);
            }

            if (item.type === "sell") {
                const asset = portfolio.assets.find((a: any) => a.symbol === item.symbol.toUpperCase());
                if (!asset || asset.shares < item.shares) {
                    return corsResponse({ error: `Insufficient shares of ${item.symbol}.` }, 400, origin);
                }
            }
        }

        // 3. Cash Liquidity Check
        const user = await User.findById(auth.user!._id);
        if (!user) throw new Error("User not found");

        const subtotal = cartItems
            .filter(item => item.type === "buy")
            .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

        const protocolFee = subtotal * 0.005;
        const totalRequired = subtotal + protocolFee;

        if (user.availableCash < totalRequired) {
            return corsResponse({ 
                error: `Insufficient funds. Required: $${totalRequired.toFixed(2)}` 
            }, 400, origin);
        }

        // 4. Generate Trade Requests
        const results = [];
        for (const item of cartItems) {
            const tradeReq = await TradeRequest.create({
                userId: user._id,
                type: item.type,
                symbol: item.symbol.toUpperCase(),
                companyName: item.companyName,
                industry: item.industry,
                logo: item.logo,
                shares: item.shares,
                pricePerShare: item.pricePerShare,
                totalAmount: item.totalAmount,
                portfolioId: item.portfolioId,
                status: "pending"
            });

            results.push({
                symbol: item.symbol,
                requestId: tradeReq._id
            });
        }

        // 5. Deduct Cash and Wipe Cart
        user.availableCash -= totalRequired;
        await user.save();
        await CartItem.deleteMany({ userId: auth.user!._id });

        return corsResponse({
            message: "Trade requests submitted successfully.",
            results,
            remainingCash: user.availableCash
        }, 200, origin);

    } catch (error: any) {
        console.error("Checkout error:", error);
        return corsResponse({ error: error.message || "Checkout process failed." }, 500, origin);
    }
}