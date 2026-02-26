import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import User from "@/lib/models/User";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/transfers - List sent and received transfers
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const [sent, received] = await Promise.all([
            PortfolioTransfer.find({ senderId: auth.user!._id }).populate('portfolioId', 'name'),
            PortfolioTransfer.find({ recipientEmail: auth.user!.email }).populate('senderId', 'firstName lastName email').populate('portfolioId', 'name')
        ]);

        return corsResponse({ sent, received }, 200, origin);
    } catch (error) {
        console.error("Transfers list API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/transfers - Initiate a transfer
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { portfolioId, recipientEmail } = body;

        if (!portfolioId || !recipientEmail) {
            return corsResponse({ error: "Portfolio ID and recipient email are required." }, 400, origin);
        }

        await connectDB();

        // Verify portfolio ownership
        const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: auth.user!._id });
        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found or access denied." }, 404, origin);
        }

        // Check if recipient exists (optional, can be pending for email)
        const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });

        const transfer = await PortfolioTransfer.create({
            portfolioId,
            senderId: auth.user!._id,
            recipientId: recipient?._id,
            recipientEmail: recipientEmail.toLowerCase().trim(),
            status: 'pending'
        });

        return corsResponse({ message: "Transfer initiated successfully.", transfer }, 201, origin);
    } catch (error) {
        console.error("Initiate transfer error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
