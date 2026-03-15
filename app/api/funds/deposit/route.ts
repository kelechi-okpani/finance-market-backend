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
        const { amount, method, currency = "USD", description, bankName, accountName, reference } = body;

        if (!amount || amount <= 0) {
            return corsResponse({ error: "Valid amount is required." }, 400, origin);
        }

        if (!method) {
            return corsResponse({ error: "Deposit method is required." }, 400, origin);
        }

        await connectDB();

        // 1. Create CashMovement (as a request for admin approval)
        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type: "deposit",
            amount,
            currency,
            method,
            status: "pending",
            date: new Date().toISOString().split('T')[0],
        });

        return corsResponse({
            message: "Deposit request submitted for Admin approval.",
            cashMovement,
        }, 201, origin);

    } catch (error) {
        console.error("Deposit API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
