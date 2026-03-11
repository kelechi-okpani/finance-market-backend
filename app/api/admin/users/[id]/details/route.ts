import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Holding from "@/lib/models/Holding";
import Portfolio from "@/lib/models/Portfolio";
import CashMovement from "@/lib/models/CashMovement";
import TradeRequest from "@/lib/models/TradeRequest";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/users/[id]/details
 * Comprehensive detailed view of a user for admin oversight.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        const user = await User.findById(id).select("-passwordHash");
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Fetch all related data in parallel for the admin
        const [
            transactions,
            holdings,
            portfolios,
            cashMovements,
            tradeRequests,
            sentTransfers,
            receivedTransfers
        ] = await Promise.all([
            Transaction.find({ userId: id }).sort({ createdAt: -1 }),
            Holding.find({ userId: id }).populate('portfolioId', 'name'),
            Portfolio.find({ userId: id }),
            CashMovement.find({ userId: id }).sort({ createdAt: -1 }),
            TradeRequest.find({ userId: id }).sort({ createdAt: -1 }),
            PortfolioTransfer.find({ senderId: id }).populate('portfolioId', 'name'),
            PortfolioTransfer.find({ recipientId: id }).populate('portfolioId', 'name').populate('senderId', 'firstName lastName email')
        ]);

        return corsResponse({
            user,
            financials: {
                totalBalance: user.totalBalance,
                availableCash: user.availableCash,
                totalInvested: holdings.reduce((sum, h) => sum + (h.shares * h.avgBuyPrice), 0),
            },
            activity: {
                transactions,
                cashMovements, // includes deposits and withdrawals requests
                tradeRequests, // includes buy/sell requests
                portfolioTransfers: {
                    sent: sentTransfers,
                    received: receivedTransfers
                }
            },
            assets: {
                portfolios,
                holdings
            }
        }, 200, origin);

    } catch (error: any) {
        console.error("Admin user details fetch error:", error);
        return corsResponse({ error: "Failed to fetch user details.", details: error.message }, 500, origin);
    }
}
