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

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { amount, method, currency = "USD", description } = body;

        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        if (!method) {
            return corsResponse({ error: "Withdrawal method is required." }, 400, origin);
        }

        await connectDB();

        // Check balance
        const user = await User.findById(auth.user!._id);
        if (!user || user.availableCash < amount) {
            return corsResponse({ error: "Insufficient available cash for withdrawal." }, 400, origin);
        }

        // 1. Create Transaction (ledger)
        const transaction = await Transaction.create({
            userId: auth.user!._id,
            type: 'withdrawal',
            amount,
            description: description || `Withdrawal via ${method}`,
        });

        // 2. Create CashMovement (for history/status tracking)
        await CashMovement.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            currency,
            method,
            status: "pending", // Withdrawals usually require approval
            date: new Date().toISOString().split('T')[0],
        });

        // 3. Update User Balance (Deduct from available cash immediately)
        await User.findByIdAndUpdate(auth.user!._id, {
            $inc: {
                totalBalance: -amount,
                availableCash: -amount
            }
        });

        return corsResponse({
            message: "Withdrawal request submitted successfully.",
            transaction
        }, 201, origin);

    } catch (error) {
        console.error("Withdrawal API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
