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

        const results = [];

        // Process each item
        for (const item of cartItems) {
            if (item.type === "buy") {
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

                // Buy logic
                const existingHolding = await Holding.findOne({
                    userId: user._id,
                    portfolioId: pId,
                    symbol: item.symbol
                });

                if (existingHolding) {
                    const newTotalShares = existingHolding.shares + item.shares;
                    const newAvg = ((existingHolding.avgBuyPrice * existingHolding.shares) + (item.pricePerShare * item.shares)) / newTotalShares;
                    existingHolding.shares = newTotalShares;
                    existingHolding.avgBuyPrice = newAvg;
                    await existingHolding.save();
                } else {
                    await Holding.create({
                        userId: user._id,
                        portfolioId: pId,
                        symbol: item.symbol,
                        companyName: item.companyName,
                        shares: item.shares,
                        avgBuyPrice: item.pricePerShare,
                        boughtAt: new Date()
                    });
                }

                await Transaction.create({
                    userId: user._id,
                    type: "buy",
                    amount: item.totalAmount,
                    description: `Cart Checkout: Bought ${item.shares} of ${item.symbol}`,
                    referenceId: item.symbol
                });

                user.availableCash -= item.totalAmount;
                results.push({ symbol: item.symbol, status: "bought", amount: item.totalAmount });

            } else if (item.type === "sell") {
                // Sell logic
                const holding = await Holding.findOne({
                    _id: item.holdingId,
                    userId: user._id
                }) || await Holding.findOne({
                    symbol: item.symbol,
                    userId: user._id
                });

                if (!holding || holding.shares < item.shares) {
                    results.push({ symbol: item.symbol, status: "failed", error: "Insufficient shares" });
                    continue;
                }

                if (holding.shares === item.shares) {
                    await Holding.deleteOne({ _id: holding._id });
                } else {
                    holding.shares -= item.shares;
                    await holding.save();
                }

                await Transaction.create({
                    userId: user._id,
                    type: "sell",
                    amount: item.totalAmount,
                    description: `Cart Checkout: Sold ${item.shares} of ${item.symbol}`,
                    referenceId: item.symbol
                });

                user.availableCash += item.totalAmount;
                results.push({ symbol: item.symbol, status: "sold", amount: item.totalAmount });
            }
        }

        await user.save();

        // Clear cart after checkout
        await CartItem.deleteMany({ userId: auth.user!._id });

        return corsResponse({
            message: "Checkout completed",
            results,
            newBalance: user.availableCash
        }, 200, origin);

    } catch (error) {
        console.error("Cart checkout error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
