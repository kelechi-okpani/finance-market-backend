import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import Transaction from "@/lib/models/Transaction";
import { requireAdmin } from "@/lib/auth";
import { corsResponse } from "@/lib/cors";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    
    // 1. Guard: Admin Only
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { action, adminRemarks } = await request.json(); 

    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Fetch the Transfer Request
        const transferRequest = await PortfolioTransfer.findById(id).session(session);
        if (!transferRequest || transferRequest.status !== 'pending') {
            throw new Error("Transfer request not found or already processed.");
        }

        // 3. Fetch the Portfolio using the ID from the request
        const portfolio = await Portfolio.findById(transferRequest.portfolioId).session(session);
        if (!portfolio) throw new Error("The portfolio being transferred no longer exists.");

        if (action === 'rejected') {
            // Logic for Rejection: Simply unlock the portfolio and mark request rejected
            portfolio.status = 'active'; 
            await portfolio.save({ session });

            transferRequest.status = 'rejected';
            transferRequest.adminNotes = adminRemarks || "Transfer request denied by administrator.";
            transferRequest.resolvedAt = new Date();
            await transferRequest.save({ session });

            await session.commitTransaction();
            return corsResponse({ message: "Transfer request rejected successfully." }, 200, origin);
        }

        if (action === 'accepted') {
            // 4. Find the Recipient (Beneficiary)
            const recipient = await User.findOne({ email: transferRequest.recipientEmail }).session(session);
            if (!recipient) throw new Error(`No user found with email: ${transferRequest.recipientEmail}`);

            const previousOwnerId = portfolio.userId;

            // 5. UPDATE PORTFOLIO OWNERSHIP
            // Because your assets are sub-documents in the Portfolio model, 
            // they move to the new owner automatically here.
            portfolio.userId = recipient._id;
            portfolio.source = 'transferred'; // Matches your logic
            portfolio.status = 'active';      // Moves from 'pending_transfer' to 'active'
            
            // Optional: Update 'addedAt' for assets to reflect the transfer date
            portfolio.assets = portfolio.assets.map(asset => ({
                ...asset,
                addedAt: new Date()
            }));

            await portfolio.save({ session });

            // 6. SYNC USER MODELS (If you track portfolio arrays on User)
            await User.findByIdAndUpdate(previousOwnerId, { 
                $pull: { portfolios: portfolio._id } 
            }).session(session);
            
            await User.findByIdAndUpdate(recipient._id, { 
                $addToSet: { portfolios: portfolio._id } 
            }).session(session);

            // 7. FINALIZE TRANSFER RECORD
            transferRequest.status = 'accepted';
            transferRequest.recipientId = recipient._id;
            transferRequest.resolvedAt = new Date();
            transferRequest.adminNotes = adminRemarks || "Portfolio transfer completed successfully.";
            await transferRequest.save({ session });

            // 8. CREATE AUDIT LOG (Transactions)
            await Transaction.insertMany([
                {
                    userId: previousOwnerId,
                    portfolioId: portfolio._id,
                    type: 'transfer',
                    amount: portfolio.totalValue || 0,
                    description: `Sent portfolio "${portfolio.name}" to ${transferRequest.recipientEmail}`,
                    status: 'completed'
                },
                {
                    userId: recipient._id,
                    portfolioId: portfolio._id,
                    type: 'transfer',
                    amount: portfolio.totalValue || 0,
                    description: `Received portfolio "${portfolio.name}" from admin-approved transfer.`,
                    status: 'completed'
                }
            ], { session });

            await session.commitTransaction();
            return corsResponse({ message: "Portfolio and all assets transferred successfully." }, 200, origin);
        }

        throw new Error("Invalid action. Must be 'accepted' or 'rejected'.");

    } catch (error: any) {
        // Rollback all changes if any step fails
        if (session.inTransaction()) await session.abortTransaction();
        console.error("TRANSFER_ERROR:", error.message);
        return corsResponse({ error: error.message }, 500, origin);
    } finally {
        session.endSession();
    }
}