import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SettlementAccount from "@/lib/models/SettlementAccount";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Use environment variables for API keys
const BANKORA_API_KEY = process.env.BANKORA_SECRET_KEY || "sk_live_65786";
const BANKORA_BASE_URL = "https://bankoradigitalbanking.vercel.app/api/public";


export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}


/**
 * Combined GET Handler
 * 1. If 'accountNumber' exists in query -> Validate via Bankora (Real-time check)
 * 2. If no query -> List user's saved resettlement accounts
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get("accountNumber");

    try {
        await connectDB();

        // --- SUB-ROUTING: VALIDATION LOGIC ---
        if (accountNumber) {
            if (accountNumber.length < 8) {
                return corsResponse({ error: "Invalid account number" }, 400, origin);
            }

            const routingNumber = searchParams.get("routingNumber") || "011000023";

            const res = await fetch(
                `${BANKORA_BASE_URL}/validate-account?accountNumber=${accountNumber}&routingNumber=${routingNumber}`,
                { headers: { "Authorization": BANKORA_API_KEY! } }
            );
            const validation = await res.json();


            if (!validation.success) {
                return corsResponse({ success: false, message: "Account not found in bank records" }, 404, origin);
            }

            return corsResponse({ success: true, data: validation }, 200, origin);
        }

        // --- SUB-ROUTING: LISTING LOGIC ---
        const accounts = await SettlementAccount.find({ userId: auth.user!._id })
            .sort({ createdAt: -1 })
            .lean();
            
        return corsResponse({ accounts }, 200, origin);

    } catch (error) {
        console.error("GET Error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

/**
 * PHASE 2: Final Link & Webhook (POST)
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { accountNumber, routingNumber, currency } = body;

        if (!accountNumber || !routingNumber) {
            return corsResponse({ error: "Missing required fields" }, 400, origin);
        }

        await connectDB();

        // 1. Re-validate one last time to ensure data integrity
        const res = await fetch(
            `${BANKORA_BASE_URL}/validate-account?accountNumber=${accountNumber}&routingNumber=${routingNumber}`,
            { headers: { "Authorization": BANKORA_API_KEY! } }
        );
        const validation = await res.json();

            console.log(validation, "validation response....")
        


        if (!validation.success) {
            return corsResponse({ error: "Verification failed at final check." }, 422, origin);
        }

        // 2. Check for duplicate to prevent multiple entries for same account
        const existing = await SettlementAccount.findOne({ accountNumber, userId: auth.user!._id });
        if (existing) {
            return corsResponse({ error: "This account is already linked." }, 400, origin);
        }

        // 3. Save to your SettlementAccountSchema using Bankora verified data
        const account = await SettlementAccount.create({
            userId: auth.user!._id,
            accountName: validation.accountHolder.accountName,
            accountNumber: validation.accountHolder.accountNumber,
            currency: validation.accountHolder.currency || "USD",
            bankName: validation.bank.name,
            routingNumber: validation.bank.routingNumber,
            bankAddress: validation?.data?.bankAddress || "",
            swiftBic: validation?.data?.swiftBic || "",
            iban: validation?.data?.iban || "",            
            fundDistributionPartner: "Bankora",
            status: "verified"
        });

        // 4. Update User Onboarding
        await User.findByIdAndUpdate(auth.user!._id, { 
            requiresResettlementAccount: false,
            $max: { onboardingStep: 13 } 
        });

        // 5. Fire and Forget the Connection Webhook
        fetch(`${BANKORA_BASE_URL}/integrations/connected`, {
            method: "POST",
            headers: { 
                "Authorization": BANKORA_API_KEY!,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ accountNumber, routingNumber })
        }).catch(e => console.error("Webhook Error:", e));

        return corsResponse({ success: true, account }, 201, origin);
    } catch (error) {
        console.error("POST Error:", error);
        return corsResponse({ error: "Internal server error" }, 500, origin);
    }
}


// /**
//  * Validates account with Bankora API
//  */
// const getValidateAccount = async (accountNumber: string, routingNumber: string) => {
//     try {
//         const response = await fetch(
//             `${BANKORA_BASE_URL}/validate-account?accountNumber=${accountNumber}&routingNumber=${routingNumber}`,
//             { 
//                 method: 'GET', 
//                 headers: { "Authorization": BANKORA_API_KEY } 
//             }
//         );
        
//         if (!response.ok) return null;
//         return await response.json();
//     } catch (error) {
//         console.error("Validation fetch error:", error);
//         return null;
//     }
// }

// /**
//  * Registers the connected account via webhook
//  */
// const sendConnectedWebhook = async (accountNumber: string, routingNumber: string) => {
//     try {
//         await fetch(`${BANKORA_BASE_URL}/integrations/connected`, {
//             method: "POST",
//             headers: {
//                 "Authorization": BANKORA_API_KEY,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ accountNumber, routingNumber })
//         });
//     } catch (error) {
//         console.error("Bankora webhook error:", error);
//     }
// }



// // POST /api/funds/resettlement - Add a new resettlement account
// export async function POST(request: NextRequest) {
//     const origin = request.headers.get("origin");
//     const auth = await requireAuth(request);
//     if (auth.error) return auth.error;

//     try {
//         const body = await request.json();
//         const { 
//             accountName, 
//             accountNumber, 
//             bankName, 
//             bankAddress, 
//             routingNumber, 
//             iban, 
//             swiftBic, 
//             currency = "USD" 
//         } = body;

//         // Basic Validation
//         if (!accountName || !accountNumber || !bankName || !routingNumber) {
//             return corsResponse({ error: "Account details and routing number are required." }, 400, origin);
//         }

//         await connectDB();

//         // 1. Validate via Bankora External API
//         const validation = await getValidateAccount(accountNumber, routingNumber);
//         if (!validation || validation.success !== true) {
//             return corsResponse({
//                 success: false,
//                 message: "Bank account validation failed. This account was not found in Bankora records.",
//                 details: validation
//             }, 422, origin);
//         }

//         // 2. Check if account is already registered globally (Fraud Prevention)
//         const globalExisting = await SettlementAccount.findOne({ accountNumber, status: "verified" });

//         if (globalExisting) {
//             const isOwner = globalExisting.userId.toString() === auth.user!._id.toString();
//             return corsResponse({ 
//                 success: false,
//                 error: isOwner 
//                     ? "This account is already on your profile." 
//                     : "This account is registered to another user." 
//             }, 400, origin);
//         }

//         // 3. Limit: One account per bank per user
//         const normalizedBank = bankName.trim();
//         const existingWithSameBank = await SettlementAccount.findOne({
//             userId: auth.user!._id,
//             bankName: { $regex: new RegExp(`^${normalizedBank}$`, "i") }
//         });

//         if (existingWithSameBank) {
//             return corsResponse({
//                 success: false,
//                 error: `You already have a ${normalizedBank} account registered.`
//             }, 400, origin);
//         }

//         // 4. Create record & update user onboarding state
//         const account = await SettlementAccount.create({
//             userId: auth.user!._id,
//             accountName,
//             accountNumber,
//             bankName: normalizedBank,
//             bankAddress,
//             routingNumber,
//             iban,
//             swiftBic,
//             currency,
//             status: "verified",
//         });

//         await User.findByIdAndUpdate(auth.user!._id, {
//             requiresResettlementAccount: false,
//             $max: { onboardingStep: 13 }
//         });

//         // 5. Fire and forget webhook
//         sendConnectedWebhook(accountNumber, routingNumber);

//         return corsResponse({
//             success: true,
//             message: "Resettlement account verified successfully.",
//             account
//         }, 201, origin);

//     } catch (error) {
//         console.error("Resettlement POST error:", error);
//         return corsResponse({ error: "Internal server error." }, 500, origin);
//     }
// }


