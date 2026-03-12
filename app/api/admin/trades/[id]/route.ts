import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TradeRequest from "@/lib/models/TradeRequest";
import User from "@/lib/models/User";
import Holding from "@/lib/models/Holding";
import Transaction from "@/lib/models/Transaction";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/admin/trades/[id]
 * Approve or Reject a stock purchase/sale request.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const { status, remarks } = await request.json();

        if (!["approved", "rejected"].includes(status)) {
            return corsResponse({ error: "Invalid status. Use approved or rejected." }, 400, origin);
        }

        await connectDB();

        const trade = await TradeRequest.findById(id);
        if (!trade) {
            return corsResponse({ error: "Trade request not found." }, 404, origin);
        }

        if (trade.status !== "pending") {
            return corsResponse({ error: "Trade request has already been processed." }, 400, origin);
        }

        const user = await User.findById(trade.userId);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        if (status === "rejected") {
            // Refund funds if it was a BUY (assuming we deducted on cart checkout)
            if (trade.type === "buy") {
                user.availableCash += trade.totalAmount;
                await user.save();
            }

            trade.status = "rejected";
            trade.adminRemarks = remarks;
            await trade.save();
            return corsResponse({ message: "Trade request rejected. Funds refunded if applicable." }, 200, origin);
        }

        // Approval Logic
        if (trade.type === "buy") {
            const Stock = (await import("@/lib/models/Stock")).default;
            const stockData = await Stock.findOne({ symbol: trade.symbol.toUpperCase() });

            const existing = await Holding.findOne({
                userId: user._id,
                portfolioId: trade.portfolioId,
                symbol: trade.symbol
            });

            if (existing) {
                const newTotal = existing.shares + trade.shares;
                const newAvg = ((existing.avgBuyPrice * existing.shares) + (trade.pricePerShare * trade.shares)) / newTotal;
                existing.shares = newTotal;
                existing.avgBuyPrice = newAvg;
                existing.sector = trade.sector || existing.sector; // Update sector name if provided
                
                // Keep the rest of market context updated
                if (stockData) {
                    existing.price = stockData.price;
                    existing.change = stockData.change;
                    existing.changePercent = stockData.changePercent;
                    existing.volume = stockData.volume;
                    existing.marketCap = stockData.marketCap;
                    existing.peRatio = stockData.peRatio;
                    existing.dividend = stockData.dividend;
                    existing.marketTrend = stockData.marketTrend;
                    existing.description = stockData.description;
                    existing.market = stockData.market;
                    existing.name = stockData.name;
                }
                await existing.save();
            } else {
                await Holding.create({
                    userId: user._id,
                    portfolioId: trade.portfolioId,
                    symbol: trade.symbol,
                    companyName: trade.companyName,
                    name: stockData?.name || trade.companyName,
                    sector: trade.sector,
                    shares: trade.shares,
                    avgBuyPrice: trade.pricePerShare,
                    boughtAt: new Date(),
                    // Snapshotted market data
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

            await Transaction.create({
                userId: user._id,
                type: "buy",
                amount: trade.totalAmount,
                description: `Admin Approved Buy: ${trade.shares} of ${trade.symbol}`,
                referenceId: trade.symbol
            });

        } else if (trade.type === "sell") {
            const holding = await Holding.findOne({
                _id: trade.holdingId,
                userId: user._id
            }) || await Holding.findOne({
                symbol: trade.symbol,
                userId: user._id
            });

            if (!holding || holding.shares < trade.shares) {
                return corsResponse({ error: "Insufficient shares available for sale at completion." }, 400, origin);
            }

            if (holding.shares === trade.shares) {
                await Holding.deleteOne({ _id: holding._id });
            } else {
                holding.shares -= trade.shares;
                await holding.save();
            }

            user.availableCash += trade.totalAmount;
            await user.save();

            await Transaction.create({
                userId: user._id,
                type: "sell",
                amount: trade.totalAmount,
                description: `Admin Approved Sell: ${trade.shares} of ${trade.symbol}`,
                referenceId: trade.symbol
            });
        }

        trade.status = "approved";
        trade.adminRemarks = remarks;
        await trade.save();

        return corsResponse({ message: `Trade ${trade.type} approved and executed successfully.` }, 200, origin);

    } catch (error: any) {
        console.error("Trade Approval error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
