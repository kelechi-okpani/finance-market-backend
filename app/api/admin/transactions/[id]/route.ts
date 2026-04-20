import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");
    const { id } = await params;

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    try {
        const { status, remarks } = await request.json();

        if (!["completed", "failed", "cancelled"].includes(status)) {
            throw new Error("Invalid status. Use completed, failed, or cancelled.");
        }

        // Removed .session(session) from all queries
        const cashRequest = await CashMovement.findById(id);
        if (!cashRequest) throw new Error("Transaction request not found.");
        if (cashRequest.status !== "pending") throw new Error(`Request is already ${cashRequest.status}.`);

        const user = await User.findById(cashRequest.userId);
        if (!user) throw new Error("User associated with this request not found.");

        if (status === "completed") {
            if (cashRequest.type === "deposit") {
                user.totalBalance += cashRequest.amount;
                user.availableCash += cashRequest.amount;

                await Transaction.create({
                    userId: user._id,
                    type: "deposit",
                    amount: cashRequest.amount,
                    description: `Deposit via ${cashRequest.method} (Approved)`,
                    referenceId: cashRequest._id.toString(),
                    status: "completed"
                });
            } else if (cashRequest.type === "withdrawal") {
                await Transaction.create({
                    userId: user._id,
                    type: "withdrawal",
                    amount: cashRequest.amount,
                    description: `Withdrawal via ${cashRequest.method} (Approved)`,
                    referenceId: cashRequest._id.toString(),
                    status: "completed"
                });
            }
        } 
        else if (status === "failed" || status === "cancelled") {
            if (cashRequest.type === "withdrawal") {
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

                if (status === "failed") {
                    user.failedWithdrawalAttempts = (user.failedWithdrawalAttempts || 0) + 1;
                    if (user.failedWithdrawalAttempts >= 3) {
                        user.requiresResettlementAccount = true;
                    }
                }
            }
        }

        cashRequest.status = status;
        // if (remarks) cashRequest.adminRemarks = remarks; 

        // Standard save
        await user.save();
        await cashRequest.save();

        return corsResponse({ message: `Request marked as ${status}.`, cashRequest }, 200, origin);

    } catch (err: any) {
        console.error("Admin PUT Transaction Error:", err);
        return corsResponse({ error: err.message || "Failed to update transaction" }, 500, origin);
    }
}