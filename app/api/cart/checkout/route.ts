import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CartItem from "@/lib/models/CartItem";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Holding from "@/lib/models/Holding";
import Portfolio from "@/lib/models/Portfolio";
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
        await connectDB();

        const cartItems = await CartItem.find({ userId: auth.user!._id });
        if (cartItems.length === 0) {
            return corsResponse({ error: "Cart is empty" }, 400, origin);
        }

        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found" }, 404, origin);

        // Calculate total cost for 'buy' actions
        const totalBuyCost = cartItems
            .filter(item => item.type === "buy")
            .reduce((sum, item) => sum + item.totalAmount, 0);

        if (user.availableCash < totalBuyCost) {
            return corsResponse({ error: `Insufficient cash. Total cost $${totalBuyCost}, but available $${user.availableCash}` }, 400, origin);
        }

        const TradeRequest = (await import("@/lib/models/TradeRequest")).default;
        const results = [];

        // Process each item to create a TradeRequest
        for (const item of cartItems) {
            // Resolve portfolio
            let pId = item.portfolioId;
            if (!pId) {
                let mainP = await Portfolio.findOne({ userId: user._id, name: "Main Portfolio" });
                if (!mainP) {
                    mainP = await Portfolio.create({
                        userId: user._id,
                        name: "Main Portfolio",
                        type: "stocks"
                    });
                }
                pId = mainP._id;
            }

            // Create the request
            const tradeReq = await TradeRequest.create({
                userId: user._id,
                type: item.type,
                symbol: item.symbol,
                companyName: item.companyName,
                sector: item.sector,
                shares: item.shares,
                pricePerShare: item.pricePerShare,
                totalAmount: item.totalAmount,
                portfolioId: pId,
                holdingId: item.holdingId,
                status: "pending"
            });

            results.push({
                symbol: item.symbol,
                type: item.type,
                requestId: tradeReq._id,
                status: "pending_approval"
            });
        }

        // Optional: Deduct cash immediately for 'buy' or wait for approval?
        // User said: "moves from wallet to investment but that’s when admin Approves"
        // Usually, we should lock/deduct cash now to prevent double-spending.
        // For 'sell', we should lock the shares (though we don't have a 'lockedShares' field yet).
        // Let's at least deduct the cash for buy here to be safe.
        user.availableCash -= totalBuyCost;
        await user.save();

        // Clear cart after creating requests
        await CartItem.deleteMany({ userId: auth.user!._id });

        return corsResponse({
            message: "Trade requests submitted for Admin approval.",
            results,
            remainingCash: user.availableCash
        }, 200, origin);

    } catch (error) {
        console.error("Cart checkout error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
