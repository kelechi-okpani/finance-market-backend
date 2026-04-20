import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import CashMovement from "@/lib/models/CashMovement";
import TradeRequest from "@/lib/models/TradeRequest";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import ChatMessage from "@/lib/models/ChatMessage";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer"; // Added
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        // 1. Fetch Core User
        const user = await User.findById(id).select("-passwordHash").lean();
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // 2. Fetch all related data in parallel (Corrected destructuring)
        const [
            portfolios,
            cashMovements,
            tradeRequests,
            kycDocuments,
            addressVerifications,
            chatCount,
            portfolioTransfers // Added
        ] = await Promise.all([
            Portfolio.find({ userId: id }).lean(),
            CashMovement.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
            TradeRequest.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
            KYCDocument.find({ userId: id }).sort({ createdAt: -1 }).lean(),
            AddressVerification.find({ userId: id }).sort({ createdAt: -1 }).lean(),
            ChatMessage.countDocuments({ userId: id }),
            PortfolioTransfer.find({ 
                $or: [{ senderId: id }, { recipientId: id }] 
            }).sort({ createdAt: -1 }).lean(),
        ]);

        // 3. Compute Financials from Embedded Assets
        // Since holdings are now embedded in portfolios, we aggregate them here
        let totalInvestedValue = 0;
        const allAssets = portfolios.flatMap((p: any) => {
            const portfolioAssets = (p.assets || []).map((asset: any) => {
                const cost = (asset.shares || 0) * (asset.averagePrice || 0);
                totalInvestedValue += cost;
                return { ...asset, portfolioName: p.name, portfolioId: p._id };
            });
            return portfolioAssets;
        });

        // 4. Return Structured Admin Data
        return corsResponse({
            user,
            summary: {
                totalBalance: user.totalBalance || 0,
                availableCash: user.availableCash || 0,
                totalInvested: totalInvestedValue,
                portfolioCount: portfolios.length,
                tradeRequestCount: tradeRequests.length,
                totalChats: chatCount,
                riskProfile: user.riskTolerance || "Not Set",
                onboardingStep: user.onboardingStep
            },
            verification: {
                kyc: kycDocuments,
                address: addressVerifications,
                isVerified: user.kycVerified || false
            },
            activity: {
                cash: cashMovements,
                trades: tradeRequests,
                transfers: portfolioTransfers, // New Section
            },
            assets: {
                portfolios: portfolios.map((p: any) => ({
                    ...p,
                    id: p._id.toString(),
                    assetCount: (p.assets || []).length
                })),
                flattenedHoldings: allAssets, // Helpful for a "All Assets" table
            }
        }, 200, origin);

    } catch (error: any) {
        console.error("Admin user details fetch error:", error);
        return corsResponse({ 
            error: "Internal server error", 
            details: error.message 
        }, 500, origin);
    }
}