import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import SettlementAccount from "@/lib/models/SettlementAccount";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/admin/cash-requests/[id]
 * Approves or rejects a deposit/withdrawal request.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");
    const { id } = await params;

    // 1. Verify Admin Permissions
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    try {
        const { status, remarks, senderName } = await request.json();

        // Validate incoming status
        if (!["completed", "failed", "cancelled"].includes(status)) {
            throw new Error("Invalid status. Use completed, failed, or cancelled.");
        }

        // 2. Fetch the Cash Request
        const cashRequest = await CashMovement.findById(id);
        if (!cashRequest) throw new Error("Transaction request not found.");
        if (cashRequest.status !== "pending") {
            throw new Error(`This request has already been marked as ${cashRequest.status}.`);
        }

        // 3. Fetch the User
        const user = await User.findById(cashRequest.userId);
        if (!user) throw new Error("User associated with this request not found.");

        // --- PROCESSING: COMPLETED STATUS ---
        if (status === "completed") {
            if (cashRequest.type === "deposit") {
                // Update User Balances
                user.totalBalance += cashRequest.amount;
                user.availableCash += cashRequest.amount;

                // Create Transaction Log
                await Transaction.create({
                    userId: user._id,
                    type: "deposit",
                    amount: cashRequest.amount,
                    description: `Deposit via ${cashRequest.method} (Approved)`,
                    referenceId: cashRequest._id.toString(),
                    status: "completed"
                });
            } 
            else if (cashRequest.type === "withdrawal") {
                // A. Fetch verified bank details
                const settlement = await SettlementAccount.findOne({ 
                    userId: user._id, 
                    status: "verified" 
                });

                if (!settlement) {
                    throw new Error("Withdrawal failed: No verified settlement account found for this user.");
                }

                // B. Call Bankora Digital Banking API
                const bankoraPayload = {
                    sendersName: senderName,
                    accountNumber: settlement.accountNumber,
                    routingNumber: settlement.routingNumber || "011000023", 
                    amount: Number(cashRequest.amount.toFixed(2)),
                    narration: `Withdrawal Ref: ${cashRequest._id.toString().slice(-6)}`
                };

                console.log("Sending Payload:", JSON.stringify(bankoraPayload));

                const bankResponse = await fetch("https://bankoradigitalbanking.vercel.app/api/public/credit-account", {
                    method: 'POST',
                    headers: {
                        "Authorization": "sk_live_65786", // Your API Key
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(bankoraPayload)
                });

                const bankResult = await bankResponse.json();
                console.log("bankResult :", bankResult);


                if (!bankResponse.ok || !bankResult.success) {
                    throw new Error(`Bank Gateway Error: ${bankResult.message || "Transfer failed"}`);
                }

                // C. Log successful withdrawal transaction
                await Transaction.create({
                    userId: user._id,
                    type: "withdrawal",
                    amount: cashRequest.amount,
                    description: `Withdrawal to ${settlement.bankName} (${settlement.accountNumber})`,
                    referenceId: cashRequest._id.toString(),
                    status: "completed"
                });
            }
        } 
        
        // --- PROCESSING: FAILED / CANCELLED STATUS ---
        else if (status === "failed" || status === "cancelled") {
            if (cashRequest.type === "withdrawal") {
                // Refund the user's balance since the money didn't leave
                user.totalBalance += cashRequest.amount;
                user.availableCash += cashRequest.amount;

                await Transaction.create({
                    userId: user._id,
                    type: "deposit", 
                    amount: cashRequest.amount,
                    description: `Refund: Withdrawal ${status}`,
                    referenceId: cashRequest._id.toString(),
                    status: "completed"
                });

                // Security logic: Flag user if they have too many failed withdrawals
                if (status === "failed") {
                    user.failedWithdrawalAttempts = (user.failedWithdrawalAttempts || 0) + 1;
                    if (user.failedWithdrawalAttempts >= 3) {
                        user.requiresResettlementAccount = true;
                    }
                }
            }
        }

        // 4. Finalize records
        cashRequest.status = status;
        // if (remarks) cashRequest.adminRemarks = remarks; 

        await user.save();
        await cashRequest.save();

        return corsResponse({ 
            message: `Request successfully marked as ${status}.`, 
            cashRequest 
        }, 200, origin);

    } catch (err: any) {
        console.error("Admin Approval Route Error:", err.message);
        return corsResponse({ 
            error: err.message || "An error occurred while updating the transaction." 
        }, 500, origin);
    }
}



// import { NextRequest } from "next/server";
// import mongoose from "mongoose";
// import connectDB from "@/lib/db";
// import CashMovement from "@/lib/models/CashMovement";
// import Transaction from "@/lib/models/Transaction";
// import User from "@/lib/models/User";
// import { requireAdmin } from "@/lib/auth";
// import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// export async function OPTIONS(request: NextRequest) {
//     return corsOptionsResponse(request.headers.get("origin"));
// }


// export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//     const origin = request.headers.get("origin");
//     const { id } = await params;

//     const auth = await requireAdmin(request);
//     if (auth.error) return auth.error;

//     await connectDB();

//     try {
//         const { status, remarks } = await request.json();

//         if (!["completed", "failed", "cancelled"].includes(status)) {
//             throw new Error("Invalid status. Use completed, failed, or cancelled.");
//         }

//         // Removed .session(session) from all queries
//         const cashRequest = await CashMovement.findById(id);
//         if (!cashRequest) throw new Error("Transaction request not found.");
//         if (cashRequest.status !== "pending") throw new Error(`Request is already ${cashRequest.status}.`);

//         const user = await User.findById(cashRequest.userId);
//         if (!user) throw new Error("User associated with this request not found.");

//         if (status === "completed") {
//             if (cashRequest.type === "deposit") {
//                 user.totalBalance += cashRequest.amount;
//                 user.availableCash += cashRequest.amount;

//                 await Transaction.create({
//                     userId: user._id,
//                     type: "deposit",
//                     amount: cashRequest.amount,
//                     description: `Deposit via ${cashRequest.method} (Approved)`,
//                     referenceId: cashRequest._id.toString(),
//                     status: "completed"
//                 });
//             } else if (cashRequest.type === "withdrawal") {
//                 await Transaction.create({
//                     userId: user._id,
//                     type: "withdrawal",
//                     amount: cashRequest.amount,
//                     description: `Withdrawal via ${cashRequest.method} (Approved)`,
//                     referenceId: cashRequest._id.toString(),
//                     status: "completed"
//                 });
//             }
//         } 
//         else if (status === "failed" || status === "cancelled") {
//             if (cashRequest.type === "withdrawal") {
//                 user.totalBalance += cashRequest.amount;
//                 user.availableCash += cashRequest.amount;

//                 await Transaction.create({
//                     userId: user._id,
//                     type: "deposit", 
//                     amount: cashRequest.amount,
//                     description: `Refund: Withdrawal ${status}`,
//                     referenceId: cashRequest._id.toString(),
//                     status: "completed"
//                 });

//                 if (status === "failed") {
//                     user.failedWithdrawalAttempts = (user.failedWithdrawalAttempts || 0) + 1;
//                     if (user.failedWithdrawalAttempts >= 3) {
//                         user.requiresResettlementAccount = true;
//                     }
//                 }
//             }
//         }

//         cashRequest.status = status;
//         // if (remarks) cashRequest.adminRemarks = remarks; 

//         // Standard save
//         await user.save();
//         await cashRequest.save();

//         return corsResponse({ message: `Request marked as ${status}.`, cashRequest }, 200, origin);

//     } catch (err: any) {
//         console.error("Admin PUT Transaction Error:", err);
//         return corsResponse({ error: err.message || "Failed to update transaction" }, 500, origin);
//     }
// }