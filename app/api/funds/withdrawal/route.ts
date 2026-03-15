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
        const { amount, method, currency = "USD", description, bankDetails, resettlementAccountId } = body;

        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        await connectDB();

        // Check user state
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        if (user.requiresResettlementAccount && !resettlementAccountId) {
            return corsResponse({
                error: "Your withdrawal has failed 3 times. Please request for a Resettlement Account to proceed with further withdrawals.",
                requiresResettlement: true,
                failedAttempts: user.failedWithdrawalAttempts
            }, 403, origin);
        }

        if (user.availableCash < amount) {
            return corsResponse({ error: "Insufficient available cash for withdrawal." }, 400, origin);
        }

        // 1. Create CashMovement (for history/status tracking)
        // Store bank details in description or metadata if model allows, for now using description
        let withdrawalNote = description || "";
        if (bankDetails) {
            withdrawalNote += ` [Bank: ${bankDetails.bankName}, Acc: ${bankDetails.accountNumber}]`;
        }

        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            currency,
            method: method || (resettlementAccountId ? "resettlement" : "bank_transfer"),
            status: "pending",
            date: new Date().toISOString().split('T')[0],
        });

        // 2. Update User Balance (Lock funds)
        user.totalBalance -= amount;
        user.availableCash -= amount;
        await user.save();

        return corsResponse({
            message: "Withdrawal request submitted for Admin approval. Funds have been locked.",
            cashMovement
        }, 201, origin);

    } catch (error) {
        console.error("Withdrawal API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
