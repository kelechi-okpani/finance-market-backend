import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/funds/deposit
 * Submits a deposit request for admin verification.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { 
            amount, 
            method, 
            currency = "USD", 
            description, 
            reference 
        } = body;

        // 1. Validate and Normalize Amount
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            return corsResponse({ error: "A valid positive amount is required." }, 400, origin);
        }

        if (!method) {
            return corsResponse({ error: "Deposit method (e.g., Wire, Transfer) is required." }, 400, origin);
        }

        await connectDB();

        // 2. Create CashMovement (Admin must approve this to update user balance)
        const cashMovement = await CashMovement.create({
            userId: auth.user!._id,
            type: "deposit",
            amount: numAmount,
            currency: currency,
            method: method,
            status: "pending",
            // Include reference in description if available
            description: description || (reference ? `Ref: ${reference}` : `Deposit via ${method}`),
            date: new Date().toISOString(), // Matches the String type in your ICashMovement model
        });

        return corsResponse({
            success: true,
            message: "Deposit request submitted. Once our team verifies the funds, your balance will be updated.",
            cashMovement,
        }, 201, origin);

    } catch (error) {
        console.error("Deposit API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}



// import { NextRequest } from "next/server";
// import connectDB from "@/lib/db";
// import Transaction from "@/lib/models/Transaction";
// import CashMovement from "@/lib/models/CashMovement";
// import User from "@/lib/models/User";
// import { requireApproved } from "@/lib/auth";
// import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// export async function OPTIONS(request: NextRequest) {
//     return corsOptionsResponse(request.headers.get("origin"));
// }

// export async function POST(request: NextRequest) {
//     const origin = request.headers.get("origin");

//     const auth = await requireApproved(request);
//     if (auth.error) return auth.error;

//     try {
//         const body = await request.json();
//         const { amount, method, currency = "USD", description, bankName, accountName, reference } = body;

//         if (!amount || amount <= 0) {
//             return corsResponse({ error: "Valid amount is required." }, 400, origin);
//         }

//         if (!method) {
//             return corsResponse({ error: "Deposit method is required." }, 400, origin);
//         }

//         await connectDB();

//         // 1. Create CashMovement (as a request for admin approval)
//         const cashMovement = await CashMovement.create({
//             userId: auth.user!._id,
//             type: "deposit",
//             amount,
//             currency,
//             method,
//             status: "pending",
//             date: new Date().toISOString().split('T')[0],
//         });

//         return corsResponse({
//             message: "Deposit request submitted for Admin approval.",
//             cashMovement,
//         }, 201, origin);

//     } catch (error) {
//         console.error("Deposit API error:", error);
//         return corsResponse({ error: "Internal server error." }, 500, origin);
//     }
// }
