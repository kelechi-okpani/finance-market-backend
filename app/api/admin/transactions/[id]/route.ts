import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import Transaction from "@/lib/models/Transaction";
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

                    await Transaction.create({
                        userId: user._id,
                        type: "deposit",
                        amount: transaction.amount,
                        description: `Deposit via ${transaction.method} (Approved)`,
                        referenceId: transaction._id.toString()
                    });
                } else if (transaction.type === "withdrawal") {
                    // Already deducted on request (locked)
                    await Transaction.create({
                        userId: user._id,
                        type: "withdrawal",
                        amount: transaction.amount,
                        description: `Withdrawal via ${transaction.method} (Approved)`,
                        referenceId: transaction._id.toString()
                    });
                }
                await user.save();
            }
        }

        // Refund if failed or cancelled
        if (status === "failed" || status === "cancelled") {
            const user = await User.findById(transaction.userId);
            if (user) {
                if (transaction.type === "withdrawal") {
                    user.totalBalance += transaction.amount;
                    user.availableCash += transaction.amount;

                    await Transaction.create({
                        userId: user._id,
                        type: "deposit",
                        amount: transaction.amount,
                        description: `Refund: Withdrawal ${status}`,
                        referenceId: transaction._id.toString()
                    });

                    if (status === "failed") {
                        user.failedWithdrawalAttempts += 1;
                        if (user.failedWithdrawalAttempts >= 3) {
                            user.requiresResettlementAccount = true;
                        }
                    }
                }
                await user.save();
            }
        }

        transaction.status = status;
        await transaction.save();

        return corsResponse({ message: `Transaction ${status} successfully.`, transaction }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update transaction", details: err.message }, 500, origin);
    }
}
