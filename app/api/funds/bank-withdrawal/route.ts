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
 * POST /api/funds/bank-withdrawal
 * Directly processes a withdrawal using a verified resettlement account and external bank API.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { amount, settlementAccountId, narration } = body;

        // Validation
        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        if (!settlementAccountId) {
            return corsResponse({ error: "A verified settlement account ID is required." }, 400, origin);
        }

        await connectDB();

        // Check user state
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Security: Block if user has 3 strikes
        if (user.requiresResettlementAccount && user.failedWithdrawalAttempts >= 3) {
            return corsResponse({
                error: "Your withdrawal access is restricted due to 3 failed attempts. Please contact support.",
                requiresResettlement: true,
                failedAttempts: user.failedWithdrawalAttempts
            }, 403, origin);
        }

        if (user.availableCash < amount) {
            return corsResponse({ error: "Insufficient available cash for withdrawal." }, 400, origin);
        }

        // Verify Settlement Account
        const settlementAccount = await SettlementAccount.findOne({
            _id: settlementAccountId,
            userId: auth.user!._id
        });

        if (!settlementAccount) {
            return corsResponse({ error: "The provided resettlement account does not exist or does not belong to your account." }, 404, origin);
        }

        if (settlementAccount.status !== "verified") {
            return corsResponse({ 
                error: "This resettlement account must be 'verified' by an administrator before use." 
            }, 400, origin);
        }

        // Prepare Bank API Payload (using verified account data)
        const bankPayload = {
            accountNumber: settlementAccount.accountNumber,
            routingNumber: settlementAccount.routingNumber || settlementAccount.iban || settlementAccount.swiftBic,
            amount: Number(amount),
            narration: narration || "StockInvest Direct withdrawal",
            sendersName: "Apple Inc" // Explicitly requested by user previously
        };

        // Call External Bank API: bankoradigitalbanking
        const bankResponse = await fetch("https://bankoradigitalbanking.vercel.app/api/public/integrations/connected", {
            method: "POST",
            headers: {
                "Authorization": "sk_live_65786",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bankPayload)
        });

        const bankData = await bankResponse.json();

        // Handle Bank Failure (Increment strikes)
        if (!bankData.success) {
            user.failedWithdrawalAttempts += 1;
            if (user.failedWithdrawalAttempts >= 3) {
                user.requiresResettlementAccount = true;
            }
            await user.save();

            return corsResponse({ 
                error: bankData.message || "Failed to process withdrawal through bank.",
                failedAttempts: user.failedWithdrawalAttempts,
                bankResponse: bankData
            }, 400, origin);
        }

        // Successfully credited bank account, now update our database
        // 1. Create CashMovement
        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            currency: "USD",
            method: "bank_transfer",
            status: "completed",
            settlementAccountId: settlementAccount._id,
            date: new Date().toISOString().split('T')[0],
        });

        // 2. Create Transaction record
        await Transaction.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            description: `Bank Withdrawal to ${settlementAccount.accountNumber} - ${bankData.data.reference}`,
            referenceId: bankData.data.reference
        });

        // 3. Update User Balance
        user.totalBalance -= amount;
        user.availableCash -= amount;
        
        // Reset failed withdrawal attempts on success
        if (user.failedWithdrawalAttempts) {
            user.failedWithdrawalAttempts = 0;
            user.requiresResettlementAccount = false; // also clear block if success happens (e.g. after manual fix)
        }

        await user.save();

        return corsResponse({
            success: true,
            message: "Direct withdrawal processed successfully.",
            data: bankData.data,
            cashMovement
        }, 201, origin);

    } catch (error) {
        console.error("Direct withdrawal API error:", error);
        return corsResponse({ error: "Internal server error during direct withdrawal processing." }, 500, origin);
    }
}
