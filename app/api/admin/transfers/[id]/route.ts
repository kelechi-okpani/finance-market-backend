import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse } from "@/lib/cors";

/**
 * PATCH /api/admin/transfers/[id]
 * Process a transfer: 'accepted' (Approve) or 'rejected' (Deny)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { action } = await request.json(); // 'accepted' | 'rejected'

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await connectDB();
        const transfer = await PortfolioTransfer.findById(id).session(session);

        if (!transfer || transfer.status !== 'pending') {
            throw new Error("Transfer request not found or already processed.");
        }

        const portfolio = await Portfolio.findById(transfer.portfolioId).session(session);
        if (!portfolio) throw new Error("Source portfolio no longer exists.");

        if (action === 'accepted') {
            // 1. Find Recipient User
            const recipient = await User.findOne({ email: transfer.recipientEmail }).session(session);
            if (!recipient) throw new Error("Recipient account no longer exists.");

            // 2. Migrate Portfolio Ownership
            portfolio.userId = recipient._id;
            portfolio.status = 'active';
            portfolio.source = 'transferred';
            await portfolio.save({ session });

            // 3. Migrate all Holdings in that portfolio
            await Holding.updateMany(
                { portfolioId: transfer.portfolioId },
                { $set: { userId: recipient._id } },
                { session }
            );

            // 4. Update Transfer Record
            transfer.status = 'accepted';
            transfer.recipientId = recipient._id;
            transfer.resolvedAt = new Date();
        } 
        else if (action === 'rejected') {
            // Unlocking the portfolio for the original user
            portfolio.status = 'active';
            await portfolio.save({ session });

            transfer.status = 'rejected';
            transfer.resolvedAt = new Date();
        }

        await transfer.save({ session });
        await session.commitTransaction();

        return corsResponse({ message: `Transfer ${action} successfully.` }, 200, origin);

    } catch (error: any) {
        await session.abortTransaction();
        return corsResponse({ error: error.message }, 500, origin);
    } finally {
        session.endSession();
    }
}