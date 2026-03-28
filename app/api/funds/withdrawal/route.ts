import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import CashMovement from "@/lib/models/CashMovement";
import User from "@/lib/models/User";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/funds/withdrawal
 * Executes a withdrawal from the user's wallet to a verified resettlement account.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { amount, resettlementAccountId, description, currency = "USD" } = body;

        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        if (!resettlementAccountId) {
            return corsResponse({ 
                error: "A valid settlement account ID is required for withdrawal. Please select a verified resettlement account." 
            }, 400, origin);
        }

        await connectDB();

        // Check user state
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Verify Settlement Account
        const settlementAccount = await SettlementAccount.findOne({
            _id: resettlementAccountId,
            userId: auth.user!._id
        });

        if (!settlementAccount) {
            return corsResponse({ error: "The provided resettlement account does not exist or does not belong to your account." }, 404, origin);
        }

        if (settlementAccount.status !== "verified") {
            return corsResponse({ 
                error: `This resettlement account is currently ${settlementAccount.status}. You can only withdraw to accounts that have been 'verified' by an administrator.` 
            }, 400, origin);
        }

        if (user.availableCash < amount) {
            return corsResponse({ error: "Insufficient available cash for withdrawal." }, 400, origin);
        }

        // 1. Create CashMovement record
        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            currency,
            method: "resettlement",
            status: "pending",
            settlementAccountId: settlementAccount._id,
            date: new Date().toISOString().split('T')[0],
        });

        // 2. Lock funds (Deduct from balance)
        // Note: Funds remain "locked" (deducted) until admin approves or fails the request.
        user.totalBalance -= amount;
        user.availableCash -= amount;
        await user.save();

        return corsResponse({
            success: true,
            message: "Withdrawal request submitted for Admin approval. Funds have been locked and will be credited to your verified resettlement account.",
            cashMovement,
            settlementAccount: {
                bankName: settlementAccount.bankName,
                accountNumber: settlementAccount.accountNumber,
                accountName: settlementAccount.accountName
            }
        }, 201, origin);

    } catch (error) {
        console.error("Withdrawal API error:", error);
        return corsResponse({ error: "Internal server error during withdrawal processing." }, 500, origin);
    }
}
