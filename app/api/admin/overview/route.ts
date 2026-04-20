import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import Transaction from "@/lib/models/Transaction";
import TradeRequest from "@/lib/models/TradeRequest";
import MarketItem from "@/lib/models/financeStock"; 
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const [
            userStats, 
            portfolioStats, 
            financialStats, 
            recentActivity, 
            marketItemStats,
            tradeRequestStats // Added
        ] = await Promise.all([
            // 1. User Growth & KYC Status
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        verifiedUsers: { $sum: { $cond: [{ $eq: ["$kycVerified", true] }, 1, 0] } },
                        pendingApprovals: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
                    }
                }
            ]),

            // 2. Portfolio Utilization Breakdown
            Portfolio.aggregate([
                { $group: { _id: "$name", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // 3. System-wide Financial Liquidity (Aggregating Embedded Assets)
            Portfolio.aggregate([
                { $unwind: "$assets" },
                {
                    $group: {
                        _id: null,
                        totalAUM: { $sum: { $multiply: ["$assets.shares", "$assets.averagePrice"] } },
                        totalShares: { $sum: "$assets.shares" },
                        uniqueAssetsCount: { $addToSet: "$assets.symbol" }
                    }
                },
                {
                    $project: {
                        totalAUM: 1,
                        totalShares: 1,
                        assetCount: { $size: "$uniqueAssetsCount" }
                    }
                }
            ]),

            // 4. Global Activity Feed
            Transaction.find().sort({ createdAt: -1 }).limit(10).lean(),

            // 5. Total Registered Market Assets Registry
            MarketItem.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStocks: { $sum: 1 },
                        activeStocks: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } }
                    }
                }
            ]),

            // 6. Trade Request Queue Stats (New)
            TradeRequest.aggregate([
                {
                    $group: {
                        _id: null,
                        pendingTrades: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        totalTradeVolume: { $sum: "$totalAmount" },
                        buyOrders: { $sum: { $cond: [{ $eq: ["$type", "buy"] }, 1, 0] } },
                        sellOrders: { $sum: { $cond: [{ $eq: ["$type", "sell"] }, 1, 0] } }
                    }
                }
            ])
        ]);

        return corsResponse({
            overview: {
                users: userStats[0] || { totalUsers: 0, verifiedUsers: 0, pendingApprovals: 0 },
                portfolios: portfolioStats,
                finances: financialStats[0] || { totalAUM: 0, assetCount: 0, totalShares: 0 },
                marketRegistry: marketItemStats[0] || { totalStocks: 0, activeStocks: 0 },
                trades: tradeRequestStats[0] || { pendingTrades: 0, totalTradeVolume: 0, buyOrders: 0, sellOrders: 0 },
                activity: recentActivity.map((a: any) => ({ 
                    ...a, 
                    id: a._id.toString() 
                }))
            }
        }, 200, origin);

    } catch (error: any) {
        console.error("Admin Overview Error:", error);
        return corsResponse({ error: error.message }, 500, origin);
    }
}