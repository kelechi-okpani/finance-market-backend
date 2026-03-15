import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Holding from "@/lib/models/Holding";
import Portfolio from "@/lib/models/Portfolio";
import CashMovement from "@/lib/models/CashMovement";
import TradeRequest from "@/lib/models/TradeRequest";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/users/[id]/details
 * Comprehensive detailed view of a user for admin oversight.
 * Includes actual KYC document URLs and address proof documents.
 */
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

        const user = await User.findById(id).select("-passwordHash");
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Fetch all related data in parallel for the admin
                const [
            transactions,
            holdings,
            portfolios,
            cashMovements,
            tradeRequests,
            sentTransfers,
            receivedTransfers,
            kycDocuments,
            addressVerifications,
            chatHistory
        ] = await Promise.all([
            Transaction.find({ userId: id }).sort({ createdAt: -1 }),
            Holding.find({ userId: id }).populate("portfolioId", "name"),
            Portfolio.find({ userId: id }),
            CashMovement.find({ userId: id }).sort({ createdAt: -1 }),
            TradeRequest.find({ userId: id }).sort({ createdAt: -1 }),
            PortfolioTransfer.find({ senderId: id }).populate("portfolioId", "name"),
            PortfolioTransfer.find({ recipientId: id })
                .populate("portfolioId", "name")
                .populate("senderId", "firstName lastName email"),
            // ★ Actual KYC identity documents with real upload URLs
            KYCDocument.find({ userId: id }).sort({ createdAt: -1 }),
            // ★ Actual address proof documents with real upload URLs
            AddressVerification.find({ userId: id }).sort({ createdAt: -1 }),
            // Fetch Chat History
            ChatMessage.find({ userId: id }).sort({ createdAt: 1 }),
        ]);

        return corsResponse({
            user,
            financials: {
                totalBalance: user.totalBalance,
                availableCash: user.availableCash,
                totalInvested: holdings.reduce((sum, h) => sum + (h.shares * h.avgBuyPrice), 0),
                failedWithdrawalAttempts: user.failedWithdrawalAttempts || 0,
                requiresResettlementAccount: user.requiresResettlementAccount || false,
            },
            // ★ All uploaded KYC documents with actual image/document URLs
            documents: {
                kyc: kycDocuments.map(doc => ({
                    _id: doc._id,
                    userId: doc.userId,
                    documentType: doc.documentType,
                    frontPageUrl: doc.frontPageUrl,   // ← actual URL stored in DB
                    backPageUrl: doc.backPageUrl,     // ← actual URL stored in DB
                    status: doc.status,
                    rejectionReason: doc.rejectionReason || null,
                    reviewedBy: doc.reviewedBy || null,
                    reviewedAt: doc.reviewedAt || null,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                })),
                address: addressVerifications.map(av => ({
                    _id: av._id,
                    userId: av.userId,
                    houseNumber: av.houseNumber,
                    streetAddress: av.streetAddress,
                    city: av.city,
                    stateProvince: av.stateProvince,
                    zipCode: av.zipCode,
                    country: av.country,
                    poaDocumentType: av.poaDocumentType,
                    poaDocumentUrl: av.poaDocumentUrl, // ← actual URL stored in DB
                    status: av.status,
                    rejectionReason: av.rejectionReason || null,
                    reviewedBy: av.reviewedBy || null,
                    reviewedAt: av.reviewedAt || null,
                    createdAt: av.createdAt,
                    updatedAt: av.updatedAt,
                })),
            },
            activity: {
                transactions,
                deposits: cashMovements.filter((m: any) => m.type === "deposit"),
                withdrawals: cashMovements.filter((m: any) => m.type === "withdrawal"),
                buys: tradeRequests.filter((r: any) => r.type === "buy"),
                sells: tradeRequests.filter((r: any) => r.type === "sell"),
                portfolioTransfers: {
                    sent: sentTransfers,
                    received: receivedTransfers,
                },
            },
            assets: {
                portfolios,
                holdings,
                pendingTrades: tradeRequests.filter((r: any) => r.status === "pending"),
            },
            chat: chatHistory.map(msg => ({
                id: msg._id,
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }))
        }, 200, origin);

    } catch (error: any) {
        console.error("Admin user details fetch error:", error);
        return corsResponse({ error: "Failed to fetch user details.", details: error.message }, 500, origin);
    }
}
