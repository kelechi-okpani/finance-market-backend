import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/funds/resettlement - List all user's resettlement accounts
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const accounts = await SettlementAccount.find({ userId: auth.user!._id }).sort({ createdAt: -1 });
        return corsResponse({ accounts }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/funds/resettlement - Add a new resettlement account
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

        // --- Step: Bankora Verification ---
        // As per requirements: "should only accept valid account number that has been created from bank ora"
        // We'll call the Bankora API to check if this account exists.
        try {
            const bankoraVerifyResponse = await fetch("https://bankoradigitalbanking.vercel.app/api/public/integrations/verify-account", {
                method: "POST",
                headers: {
                    "Authorization": "sk_live_65786",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accountNumber,
                    accountName,
                    bankName
                })
            });

            const bankoraData = await bankoraVerifyResponse.json();

            if (!bankoraVerifyResponse.ok || !bankoraData.success) {
                return corsResponse({ 
                    error: "Unable to find this account in Bankora. Please ensure you have created your resettlement account correctly in the Bankora system.",
                    details: bankoraData.message || "Account not found."
                }, 400, origin);
            }
        } catch (fetchError) {
            console.error("Bankora Verification Request Failed:", fetchError);
            // If the verification API is down, we fallback to a developer-friendly error or still block if strict
            return corsResponse({ error: "Bankora verification service is currently unavailable. Please try again later." }, 503, origin);
        }

        // --- Step: Create Settlement Account record ---
        // Create a new settlement account (validated by Bankora, so we mark it as verified)
        const account = await SettlementAccount.create({
            userId: auth.user!._id,
            accountName,
            accountNumber,
            bankName,
            bankAddress,
            routingNumber,
            iban,
            swiftBic,
            currency: currency || "USD",
            status: "verified" // Validated by Bankora, so it's ready for use
        });

        return corsResponse({
            success: true,
            message: "Resettlement account added successfully and verified through Bankora.",
            account
        }, 201, origin);

    } catch (error) {
        console.error("Resettlement POST error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
