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
        const { accountNumber, routingNumber, amount, narration } = body;

        // Skip OTP validation as requested: "know that OTP is not working"
        
        if (!accountNumber || !routingNumber || !amount || amount <= 0) {
            return corsResponse({ error: "Missing required fields or invalid amount." }, 400, origin);
        }

        await connectDB();

        // Check user state
        const user = await User.findById(auth.user!._id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        if (user.availableCash < amount) {
            return corsResponse({ error: "Insufficient available cash for withdrawal." }, 400, origin);
        }

        // Call External Bank API: bankoradigitalbanking
        const bankPayload = {
            accountNumber,
            routingNumber,
            amount: Number(amount),
            narration: narration || "StockInvest withdrawal",
            sendersName: "Apple Inc" // Explicitly requested by user
        };

        const bankResponse = await fetch("https://bankoradigitalbanking.vercel.app/api/public/credit-account", {
            method: "POST",
            headers: {
                "Authorization": "sk_live_65786",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bankPayload)
        });

        const bankData = await bankResponse.json();

        if (!bankData.success) {
            return corsResponse({ 
                error: bankData.message || "Failed to process withdrawal through bank.",
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
            date: new Date().toISOString().split('T')[0],
        });

        // 2. Create Transaction record
        await Transaction.create({
            userId: auth.user!._id,
            type: "withdrawal",
            amount,
            description: `Bank Withdrawal to ${accountNumber} - ${bankData.data.reference}`,
            referenceId: bankData.data.reference
        });

        // 3. Update User Balance
        user.totalBalance -= amount;
        user.availableCash -= amount;
        
        // Reset failed withdrawal attempts if they exist, to help user after a success
        if (user.failedWithdrawalAttempts) {
            user.failedWithdrawalAttempts = 0;
        }

        await user.save();

        return corsResponse({
            success: true,
            message: "Withdrawal processed successfully.",
            data: bankData.data,
            cashMovement
        }, 201, origin);

    } catch (error) {
        console.error("Bank Withdrawal API error:", error);
        return corsResponse({ error: "Internal server error during withdrawal processing." }, 500, origin);
    }
}
