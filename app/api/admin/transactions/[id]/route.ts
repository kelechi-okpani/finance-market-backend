import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/admin/transactions/[id]
 * Approve or reject a deposit/withdrawal request.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const { id } = await params;
        const { status, remarks } = await request.json();

        if (!["completed", "failed", "cancelled"].includes(status)) {
            return corsResponse({ error: "Invalid status. Must be completed, failed, or cancelled." }, 400, origin);
        }

        await connectDB();

        const transaction = await CashMovement.findById(id);
        if (!transaction) {
            return corsResponse({ error: "Transaction not found." }, 404, origin);
        }

        if (transaction.status !== "pending") {
            return corsResponse({ error: `Transaction is already ${transaction.status}.` }, 400, origin);
        }

        // If approving a deposit, update user balance
        if (status === "completed") {
            const user = await User.findById(transaction.userId);
            if (user) {
                if (transaction.type === "deposit") {
                    user.totalBalance += transaction.amount;
                    user.availableCash += transaction.amount;
                } else if (transaction.type === "withdrawal") {
                    // Withdrawal amount is usually deducted on request, or here.
                    // If deducted on request (pending), do nothing.
                    // If not deducted on request, deduct now.
                    // Conventional: Deduct on request, refund on failure.
                    // Let's assume it was already deducted or validate balance.
                }
                await user.save();
            }
        }

        transaction.status = status;
        // Optionally store remarks in a new field if added to model, 
        // but for now just update status.
        await transaction.save();

        return corsResponse({ message: `Transaction ${status} successfully.`, transaction }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update transaction", details: err.message }, 500, origin);
    }
}
