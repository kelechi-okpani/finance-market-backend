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
            return corsResponse({ error: "Deposit method is required." }, 400, origin);
        }

        await connectDB();

        // 1. Create Transaction (ledger)
        const transaction = await Transaction.create({
            userId: auth.user!._id,
            type: 'deposit',
            amount,
            description: description || `Deposit via ${method}`,
        });

        // 2. Create CashMovement (for history/status tracking)
        await CashMovement.create({
            userId: auth.user!._id,
            type: "deposit",
            amount,
            currency,
            method,
            status: "completed", // Assuming instant for this API, or "pending" if it needs admin approval
            date: new Date().toISOString().split('T')[0],
        });

        // 3. Update User Balance
        await User.findByIdAndUpdate(auth.user!._id, {
            $inc: {
                totalBalance: amount,
                availableCash: amount
            }
        });

        return corsResponse({
            message: "Deposit successful.",
            transaction
        }, 201, origin);

    } catch (error) {
        console.error("Deposit API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
