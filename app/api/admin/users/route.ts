import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import CashMovement from "@/lib/models/CashMovement";
import TradeRequest from "@/lib/models/TradeRequest";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import StockTransfer from "@/lib/models/HoldingTransfer";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/admin/users - List all users


export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status"); // 'active', 'pending', 'suspended'
        const search = searchParams.get("search");
        const skip = (page - 1) * limit;

        // 1. Build Dynamic Filter
        const filter: any = { role: "user" };
        if (status && status !== "all") {
            filter.accountStatus = status;
        }
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { investorCode: { $regex: search, $options: "i" } }
            ];
        }

        // 2. Execute Primary Query
        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-passwordHash")
                .lean(),
            User.countDocuments(filter),
        ]);

        const userIds = users.map(u => u._id);

        // 3. Aggregate Activity Stats (Counts only)
        const [cashStats, tradeStats] = await Promise.all([
            CashMovement.aggregate([
                { $match: { userId: { $in: userIds } } },
                { $group: { 
                    _id: "$userId", 
                    deposits: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, 1, 0] } },
                    withdrawals: { $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, 1, 0] } }
                }}
            ]),
            TradeRequest.aggregate([
                { $match: { userId: { $in: userIds } } },
                { $group: { 
                    _id: "$userId", 
                    buys: { $sum: { $cond: [{ $eq: ["$type", "buy"] }, 1, 0] } },
                    sells: { $sum: { $cond: [{ $eq: ["$type", "sell"] }, 1, 0] } }
                }}
            ])
        ]);

        // 4. Merge Data for Frontend
        const usersWithData = users.map(user => {
            const cash = cashStats.find(c => c._id.toString() === user._id.toString());
            const trades = tradeStats.find(t => t._id.toString() === user._id.toString());
            return {
                ...user,
                activitySummary: {
                    deposits: cash?.deposits || 0,
                    withdrawals: cash?.withdrawals || 0,
                    buys: trades?.buys || 0,
                    sells: trades?.sells || 0
                }
            };
        });

        return corsResponse({
            users: usersWithData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, 200, origin);

    } catch (error: any) {
        return corsResponse({ error: "Internal server error", details: error.message }, 500, origin);
    }
}

// export async function GET(request: NextRequest) {
//     const origin = request.headers.get("origin");

//     const auth = await requireAdmin(request);
//     if (auth.error) return auth.error;

//     try {
//         await connectDB();

//         const { searchParams } = new URL(request.url);
//         const status = searchParams.get("status");
//         const role = searchParams.get("role");
//         const page = parseInt(searchParams.get("page") || "1");
//         const limit = parseInt(searchParams.get("limit") || "20");
//         const skip = (page - 1) * limit;

//         // Build filter
//         const filter: Record<string, string> = {};
//         if (status && ["pending", "approved", "rejected"].includes(status)) {
//             filter.status = status;
//         }
//         if (role && ["user", "admin"].includes(role)) {
//             filter.role = role;
//         }

//         const [users, total] = await Promise.all([
//             User.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .select("-passwordHash")
//                 .lean(),
//             User.countDocuments(filter),
//         ]);

//         // Fetch transactions, trades, and transfers for each user
//         const userIds = users.map(u => u._id);
//         const [allCashMovements, allTrades, allPortfolioTransfers, allStockTransfers] = await Promise.all([
//             CashMovement.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean(),
//             TradeRequest.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean(),
//             PortfolioTransfer.find({ senderId: { $in: userIds } }).sort({ createdAt: -1 }).lean(),
//             StockTransfer.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean()
//         ]);

//         const usersWithData = users.map(user => {
//             const userCash = (allCashMovements as any[]).filter(t => t.userId.toString() === user._id.toString());
//             const userTrades = (allTrades as any[]).filter(t => t.userId.toString() === user._id.toString());
//             const userPortfolioTs = (allPortfolioTransfers as any[]).filter(t => t.senderId.toString() === user._id.toString());
//             const userStockTs = (allStockTransfers as any[]).filter(t => t.userId.toString() === user._id.toString());

//             return {
//                 ...user,
//                 deposits: userCash.filter(t => t.type === 'deposit'),
//                 withdrawals: userCash.filter(t => t.type === 'withdrawal'),
//                 buys: userTrades.filter(t => t.type === 'buy'),
//                 sells: userTrades.filter(t => t.type === 'sell'),
//                 transfers: [...userPortfolioTs, ...userStockTs]
//             };
//         });

//         return corsResponse(
//             {
//                 users: usersWithData,
//                 pagination: {
//                     page,
//                     limit,
//                     total,
//                     totalPages: Math.ceil(total / limit),
//                 },
//             },
//             200,
//             origin
//         );
//     } catch (error) {
//         console.error("Admin users error:", error);
//         return corsResponse({ error: "Internal server error." }, 500, origin);
//     }
// }
