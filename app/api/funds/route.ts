import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import PaymentMethod from "@/lib/models/PaymentMethod";
import CashMovement from "@/lib/models/CashMovement";
import User from "@/lib/models/User";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/funds/summary - Get balance and activity totals
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const [transactions, pendingMovements] = await Promise.all([
            Transaction.find({ userId: auth.user!._id }),
            CashMovement.find({ userId: auth.user!._id, status: "pending" })
        ]);

        const totalDeposits = transactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalWithdrawals = transactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSpentOnStocks = transactions
            .filter(t => t.type === 'buy')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSoldStocks = transactions
            .filter(t => t.type === 'sell')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalDeposits - totalWithdrawals - totalSpentOnStocks + totalSoldStocks;

        return corsResponse({
            balance,
            totalDeposits,
            totalWithdrawals,
            pending: pendingMovements,
            history: transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)
        }, 200, origin);
    } catch (error) {
        console.error("Funds summary API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/funds/transaction - Create a deposit or withdrawal
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { type, amount, description, paymentMethodId } = body;

        if (!type || !amount || !['deposit', 'withdrawal'].includes(type)) {
            return corsResponse({ error: "Type (deposit/withdrawal) and amount are required." }, 400, origin);
        }

        await connectDB();

        // If withdrawal, check balance first
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        if (type === 'withdrawal' && user.availableCash < amount) {
            return corsResponse({ error: "Insufficient balance for withdrawal." }, 400, origin);
        }

        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type,
            amount,
            method: paymentMethodId || "manual",
            status: "pending",
            date: new Date().toISOString().split('T')[0],
        });

        // For withdrawals, lock funds immediately
        if (type === 'withdrawal') {
            user.availableCash -= amount;
            user.totalBalance -= amount;
            await user.save();
        }

        return corsResponse({ 
            message: "Transaction request submitted for Admin approval.", 
            cashMovement 
        }, 201, origin);
    } catch (error) {
        console.error("Funds transaction API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
