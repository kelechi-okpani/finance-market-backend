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
        // New requirement: take full bank details to validate against existing verified ones
        const { amount, accountNumber, bankName, accountName, resettlementAccountId, description, currency = "USD" } = body;

        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        await connectDB();

        // Check user state
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // --- Step 1: Check for existing resettlement accounts ---
        const userResettlementAccounts = await SettlementAccount.find({
            userId: auth.user!._id,
            status: "verified"
        });

        if (userResettlementAccounts.length === 0) {
            return corsResponse({ 
                error: "Unable to add bank account, kindly create a resettlement account.",
                helpText: "You must first create a verified account through the 'Apply for Resettlement' section using your Bankora details."
            }, 400, origin);
        }

        // --- Step 2: Validate submitted details against verified ones ---
        let settlementAccount;

        // Ensure we are working with strings for comparison
        const normalizedSubmitAccount = accountNumber ? String(accountNumber).trim() : null;
        const normalizedSubmitBank = bankName ? String(bankName).trim().toLowerCase() : null;

        // If an ID is provided, try to find by ID first
        if (resettlementAccountId) {
            settlementAccount = userResettlementAccounts.find(acc => acc._id.toString() === resettlementAccountId.toString());
        }

        // If no ID or ID didn't match, check by account number and bank name (if provided)
        if (!settlementAccount && normalizedSubmitAccount) {
            settlementAccount = userResettlementAccounts.find(acc => {
                const accNum = String(acc.accountNumber).trim();
                const accBank = String(acc.bankName).trim().toLowerCase();

                // Match by account number (primary)
                const numMatch = accNum === normalizedSubmitAccount;
                
                // Match by bank name (if provided)
                const bankMatch = normalizedSubmitBank ? accBank === normalizedSubmitBank : true;

                return numMatch && bankMatch;
            });
        }

        if (!settlementAccount) {
            return corsResponse({ 
                error: "The bank details submitted do not match any of your verified resettlement accounts. Please use your pre-approved Bankora account details.",
                submitted: { accountNumber: normalizedSubmitAccount, bankName: normalizedSubmitBank },
                verifiedAccountsSummary: userResettlementAccounts.map(a => `${a.bankName} (***${a.accountNumber.slice(-4)})`)
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
