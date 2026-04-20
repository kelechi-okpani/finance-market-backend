import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
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

        // 1. Fetch user directly for the source-of-truth balance
        // 2. Fetch movements and transactions
        const [user, transactions, pendingMovements] = await Promise.all([
            User.findById(auth.user!._id).select("availableCash totalBalance baseCurrency"),
            Transaction.find({ userId: auth.user!._id }).sort({ createdAt: -1 }),
            CashMovement.find({ userId: auth.user!._id, status: "pending" })
        ]);

        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Calculate aggregates for the UI summary cards
        const totalDeposits = transactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalWithdrawals = transactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return corsResponse({
            balance: user.availableCash, // Use the stored balance instead of recalculating
            totalBalance: user.totalBalance,
            totalDeposits,
            totalWithdrawals,
            currency: user.baseCurrency,
            pending: pendingMovements,
            history: transactions.slice(0, 10) // Already sorted by query
        }, 200, origin);
    } catch (error) {
        console.error("Funds summary API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/funds/transaction - Create a deposit or withdrawal request
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { type, amount, paymentMethodId, description } = body;
        const numAmount = Number(amount);

        // Validation
        if (!type || !numAmount || numAmount <= 0 || !['deposit', 'withdrawal'].includes(type)) {
            return corsResponse({ error: "Valid type and positive amount are required." }, 400, origin);
        }

        await connectDB();

        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Logic for Withdrawal: Immediate Deduction (Locked Funds)
        if (type === 'withdrawal') {
            if (user.availableCash < numAmount) {
                return corsResponse({ error: "Insufficient balance for withdrawal." }, 400, origin);
            }
            
            // Deduct immediately so they can't double-withdraw while admin is pending
            user.availableCash -= numAmount;
            // Note: totalBalance usually includes stock value + cash. 
            // If totalBalance is strictly cash, deduct here too.
            user.totalBalance -= numAmount; 
            await user.save();
        }

        // Create the pending request for Admin dashboard
            const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type,
            amount: numAmount,
            method: paymentMethodId || "manual",
            description: description || `${type} request`,
            status: "pending",
            date: new Date().toISOString(), // Change this to a string
        });

        return corsResponse({ 
            message: type === 'withdrawal' 
                ? "Withdrawal request submitted. Funds have been locked for processing." 
                : "Deposit request submitted for Admin approval.", 
            cashMovement,
            currentBalance: user.availableCash
        }, 201, origin);
    } catch (error) {
        console.error("Funds transaction API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}