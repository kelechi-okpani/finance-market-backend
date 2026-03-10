import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/funds/resettlement - Get user's resettlement account status
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const account = await SettlementAccount.findOne({ userId: auth.user!._id });
        return corsResponse({ account }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/funds/resettlement - Request a resettlement account
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { accountName, accountNumber, bankName, bankAddress, routingNumber, iban, swiftBic, currency } = body;

        if (!accountName || !accountNumber || !bankName) {
            return corsResponse({ error: "Account name, number, and bank name are required." }, 400, origin);
        }

        await connectDB();

        const account = await SettlementAccount.findOneAndUpdate(
            { userId: auth.user!._id },
            {
                accountName,
                accountNumber,
                bankName,
                bankAddress,
                routingNumber,
                iban,
                swiftBic,
                currency: currency || "USD",
                status: "pending_verification"
            },
            { upsert: true, new: true }
        );

        return corsResponse({
            message: "Resettlement account request submitted successfully.",
            account
        }, 201, origin);

    } catch (error) {
        console.error("Resettlement POST error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
