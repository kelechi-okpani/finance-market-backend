import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
// Force model registration
import "@/lib/models/User";
import "@/lib/models/Portfolio";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse } from "@/lib/cors";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { action } = await request.json(); // 'accepted' | 'rejected'

    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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

            // 2. Prevent Duplicate Ownership (Optional but safe)
            const previousOwnerId = portfolio.userId;

            // 3. Migrate Portfolio Ownership
            portfolio.userId = recipient._id;
            portfolio.status = 'active';
            portfolio.source = 'transferred';
            // If you track the name of the owner on the portfolio:
            // portfolio.ownerName = `${recipient.firstName} ${recipient.lastName}`;
            
            await portfolio.save({ session });

            // 4. Update User References (If your User model has a 'portfolios' array)
            // Remove from old user, add to new user
            await User.findByIdAndUpdate(previousOwnerId, { $pull: { portfolios: portfolio._id } }).session(session);
            await User.findByIdAndUpdate(recipient._id, { $addToSet: { portfolios: portfolio._id } }).session(session);

            // 5. Update Transfer Record
            transfer.status = 'accepted';
            transfer.recipientId = recipient._id;
            transfer.resolvedAt = new Date();
        } 
        else if (action === 'rejected') {
            // Unlock the portfolio for the original user
            portfolio.status = 'active';
            await portfolio.save({ session });

            transfer.status = 'rejected';
            transfer.resolvedAt = new Date();
        } else {
            throw new Error("Invalid action provided.");
        }

        await transfer.save({ session });
        await session.commitTransaction();

        return corsResponse({ message: `Transfer ${action} successfully.` }, 200, origin);

    } catch (error: any) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Transfer PATCH Error:", error);
        return corsResponse({ error: error.message || "Transfer processing failed." }, 500, origin);
    } finally {
        session.endSession();
    }
}