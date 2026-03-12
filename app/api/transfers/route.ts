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

interface TransferAssetItem {
    assetSymbol: string;
    shares: number;
    assetName?: string;
    valueAtTransfer?: number;
}

// POST /api/transfers - Initiate a transfer
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { 
            portfolioId, 
            toUserEmail, 
            assets,
            firstName,
            lastName,
            address,
            phone,
            description
        } = body;

        const inputAssets: TransferAssetItem[] = assets || [];

        if (!portfolioId || !toUserEmail) {
            return corsResponse({ error: "portfolioId and toUserEmail are required." }, 400, origin);
        }

        const recipientEmail = toUserEmail;

        await connectDB();

        // Verify portfolio ownership
        const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: auth.user!._id });
        if (!portfolio) {
            return corsResponse({ error: "Portfolio not found or access denied." }, 404, origin);
        }

        // Check if recipient exists
        const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });

        // Fetch current holdings for accounting/verification
        const Holding = (await import("@/lib/models/Holding")).default;
        const currentHoldings = await Holding.find({ portfolioId, userId: auth.user!._id });

        // Map and validate transferred assets
        const assetsSnapshot = inputAssets.map(item => {
            const holding = currentHoldings.find(h => h.symbol.toUpperCase() === item.assetSymbol.toUpperCase());
            return {
                symbol: item.assetSymbol.toUpperCase(),
                shares: item.shares,
                assetName: item.assetName || holding?.companyName || item.assetSymbol,
                valueAtTransfer: item.valueAtTransfer,
                // Internal accounting
                avgBuyPrice: holding?.avgBuyPrice,
                totalValue: (holding?.avgBuyPrice || 0) * item.shares
            };
        });

        // Totals for this specific transfer request
        const totalAssets = assetsSnapshot.length;
        const totalShares = assetsSnapshot.reduce((sum, h) => sum + h.shares, 0);
        const totalValue = assetsSnapshot.reduce((sum, h) => sum + (h.totalValue || 0), 0);

        const transfer = await PortfolioTransfer.create({
            portfolioId,
            senderId: auth.user!._id,
            recipientId: recipient?._id,
            recipientEmail: recipientEmail.toLowerCase().trim(),
            recipientFirstName: firstName,
            recipientLastName: lastName,
            recipientAddress: address,
            recipientPhone: phone,
            transferInstruction: description,
            assets: assetsSnapshot,
            totalAssets,
            totalShares,
            totalValue,
            status: 'pending'
        });

        return corsResponse({ message: "Transfer initiated successfully.", transfer }, 201, origin);
    } catch (error) {
        console.error("Initiate transfer error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
