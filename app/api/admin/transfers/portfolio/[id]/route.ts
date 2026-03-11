import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/admin/transfers/portfolio/[id]
 * Admin approves or rejects a portfolio transfer.
 * If approved, the portfolio and its assets are reassigned to the recipient.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const { status, recipientId: manualRecipientId } = await request.json();

        if (!["accepted", "rejected"].includes(status)) {
            return corsResponse({ error: "Invalid status. Use accepted or rejected." }, 400, origin);
        }

        await connectDB();

        const transfer = await PortfolioTransfer.findById(id);
        if (!transfer) {
            return corsResponse({ error: "Transfer request not found." }, 404, origin);
        }

        if (transfer.status !== "pending") {
            return corsResponse({ error: "Transfer is already processed." }, 400, origin);
        }

        if (status === "rejected") {
            transfer.status = "rejected";
            transfer.resolvedAt = new Date();
            await transfer.save();
            return corsResponse({ message: "Transfer rejected successfully." }, 200, origin);
        }

        // Approval Logic: Reassign Portfolio and Holdings
        const recipientId = manualRecipientId || transfer.recipientId;
        if (!recipientId) {
            return corsResponse({ error: "Recipient ID is missing. Please provide it or ensure the email matches a user." }, 400, origin);
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return corsResponse({ error: "Recipient user not found." }, 404, origin);
        }

        // 1. Update Portfolio Owner
        const portfolio = await Portfolio.findById(transfer.portfolioId);
        if (portfolio) {
            portfolio.userId = recipient._id;
            await portfolio.save();
        }

        // 2. Update all Holdings in that Portfolio
        await Holding.updateMany(
            { portfolioId: transfer.portfolioId },
            { $set: { userId: recipient._id } }
        );

        // 3. Complete Transfer record
        transfer.status = "accepted";
        transfer.recipientId = recipient._id;
        transfer.resolvedAt = new Date();
        await transfer.save();

        return corsResponse({
            message: "Portfolio transfer approved and reassigned successfully.",
            transfer
        }, 200, origin);

    } catch (error: any) {
        console.error("Portfolio Transfer Approval error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
