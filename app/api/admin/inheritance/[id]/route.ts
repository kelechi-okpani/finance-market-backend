import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import PortfolioInheritance from "@/lib/models/PortfolioInheritance";
import Transaction from "@/lib/models/Transaction";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PATCH /api/admin/inheritance/[id]
 * Approve or reject an inheritance claim.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { action, portfolioId, adminRemarks } = await request.json(); // action: 'completed' | 'rejected'

    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const claim = await PortfolioInheritance.findById(id).session(session);
        if (!claim || claim.status !== 'pending') {
            throw new Error("Claim not found or already processed.");
        }

        if (action === 'rejected') {
            claim.status = 'rejected';
            claim.adminNotes = adminRemarks || "Documentation verification failed.";
            claim.resolvedAt = new Date();
            await claim.save({ session });
            await session.commitTransaction();
            return corsResponse({ message: "Inheritance request rejected." }, 200, origin);
        }

        // --- APPROVAL LOGIC ---
        // 1. Identify the portfolio to move
        const targetPortfolio = await Portfolio.findById(portfolioId || claim.portfolioId).session(session);
        if (!targetPortfolio) throw new Error("Target portfolio not found.");

        // 2. Change Portfolio Ownership
        targetPortfolio.userId = claim.beneficiaryId;
        targetPortfolio.source = 'inherited';
        targetPortfolio.status = 'active';
        await targetPortfolio.save({ session });

        // 3. Migrate all holdings within that portfolio
        await Holding.updateMany(
            { portfolioId: targetPortfolio._id },
            { $set: { userId: claim.beneficiaryId } },
            { session }
        );

        // 4. Update the claim status
        claim.status = 'completed';
        claim.portfolioId = targetPortfolio._id;
        claim.resolvedAt = new Date();
        claim.adminNotes = adminRemarks || "Inheritance finalized.";
        await claim.save({ session });

        // 5. Create Ledger entries for audit trail
        await Transaction.create([
            {
                userId: claim.originalOwnerId,
                portfolioId: targetPortfolio._id,
                type: 'transfer',
                amount: targetPortfolio.totalValue,
                description: `Portfolio "${targetPortfolio.name}" inherited by beneficiary.`,
                status: 'completed'
            },
            {
                userId: claim.beneficiaryId,
                portfolioId: targetPortfolio._id,
                type: 'transfer',
                amount: targetPortfolio.totalValue,
                description: `Received portfolio "${targetPortfolio.name}" via inheritance.`,
                status: 'completed'
            }
        ], { session });

        await session.commitTransaction();
        return corsResponse({ message: "Inheritance approved and assets moved." }, 200, origin);

    } catch (error: any) {
        await session.abortTransaction();
        return corsResponse({ error: error.message || "Approval process failed." }, 500, origin);
    } finally {
        session.endSession();
    }
}