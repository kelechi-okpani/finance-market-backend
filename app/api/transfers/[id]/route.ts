import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/transfers/[id] - Accept or Reject a transfer
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'accept' or 'reject'

        if (!action || !['accept', 'reject'].includes(action)) {
            return corsResponse({ error: "Action must be 'accept' or 'reject'." }, 400, origin);
        }

        await connectDB();

        const transfer = await PortfolioTransfer.findById(id);
        if (!transfer) {
            return corsResponse({ error: "Transfer request not found." }, 404, origin);
        }

        // Verify current user is the recipient
        if (transfer.recipientEmail.toLowerCase() !== auth.user!.email.toLowerCase()) {
            return corsResponse({ error: "Unauthorized. You are not the recipient of this transfer." }, 403, origin);
        }

        if (transfer.status !== 'pending') {
            return corsResponse({ error: `Transfer has already been ${transfer.status}.` }, 400, origin);
        }

        if (action === 'accept') {
            // Perform the actual transfer of ownership
            const portfolio = await Portfolio.findById(transfer.portfolioId);
            if (portfolio) {
                portfolio.userId = auth.user!._id;
                portfolio.source = 'transferred';
                await portfolio.save();

                // Also update all holdings to new owner
                await Holding.updateMany(
                    { portfolioId: transfer.portfolioId },
                    { $set: { userId: auth.user!._id } }
                );
            }

            transfer.status = 'accepted';
            transfer.resolvedAt = new Date();
            await transfer.save();

            return corsResponse({ message: "Portfolio transfer accepted.", transfer }, 200, origin);
        } else {
            transfer.status = 'rejected';
            transfer.resolvedAt = new Date();
            await transfer.save();

            return corsResponse({ message: "Portfolio transfer rejected.", transfer }, 200, origin);
        }
    } catch (error) {
        console.error("Resolve transfer error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
