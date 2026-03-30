import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

const getValidateAccount = async (accountNumber: string, routingNumber: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "sk_live_65786");

    try {
        const response = await fetch(
            `https://bankoradigitalbanking.vercel.app/api/public/validate-account?accountNumber=${accountNumber}&routingNumber=${routingNumber}`,
            { method: 'GET', headers: myHeaders }
        );
        const result = await response.json();
        return result;
    } catch (error) {
        return null;
    }
}

// Step 3: Send webhook to Bankora to register the connected account
const sendConnectedWebhook = async (accountNumber: string, routingNumber: string) => {
    try {
        const headers = new Headers();
        headers.append("Authorization", "sk_live_65786");
        headers.append("Content-Type", "application/json");

        await fetch("https://bankoradigitalbanking.vercel.app/api/public/integrations/connected", {
            method: "POST",
            headers,
            body: JSON.stringify({ accountNumber, routingNumber })
        });
    } catch (error) {
        console.error("Bankora webhook error:", error);
    }
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

        // --- Step: Check for duplicate account ---
        const existingAccount = await SettlementAccount.findOne({
            userId: auth.user!._id,
            accountNumber
        });
        if (existingAccount) {
            return corsResponse({ error: "This account number is already registered." }, 400, origin);
        }

        // --- Step 1: Validate account via Bankora ---
        const validation = await getValidateAccount(accountNumber, routingNumber);
        const isValid = validation && validation.success === true;

        // --- Step 2: Create Settlement Account record ---
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
            status: isValid ? "verified" : "failed",
        });

        // --- Step 3: Update User Profile (mark resettlement as complete) ---
        if (isValid) {
            await User.findByIdAndUpdate(auth.user!._id, {
                requiresResettlementAccount: false,
                $max: { onboardingStep: 13 } // Proceeding to the next onboarding step
            });

            sendConnectedWebhook(accountNumber, routingNumber);
        }

        if (!isValid) {
            return corsResponse({
                success: false,
                message: "Bank account validation failed. Please check your account number and routing number.",
                account,
                validation
            }, 422, origin);
        }

        return corsResponse({
            success: true,
            message: "Resettlement account verified and saved successfully.",
            account,
            validation
        }, 201, origin);

    } catch (error) {
        console.error("Resettlement POST error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
