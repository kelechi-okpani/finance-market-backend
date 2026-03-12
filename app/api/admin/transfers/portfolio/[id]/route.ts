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

        // Logic for Partial (Multi-Asset) vs Full Transfer
        if (transfer.assets && transfer.assets.length > 0) {
            // Find or create recipient's Main Portfolio
            let recipientPortfolio = await Portfolio.findOne({ userId: recipient._id, name: "Main Portfolio" });
            if (!recipientPortfolio) {
                recipientPortfolio = await Portfolio.create({ userId: recipient._id, name: "Main Portfolio" });
            }

            for (const item of transfer.assets) {
                // Find source holding
                const sourceHolding = await Holding.findOne({
                    userId: transfer.senderId,
                    portfolioId: transfer.portfolioId,
                    symbol: item.symbol
                });

                if (!sourceHolding) continue; // Skip if holding not found anymore

                const transferShares = Math.min(item.shares, sourceHolding.shares);
                
                // Update recipient's holdings
                const existingRecipientHolding = await Holding.findOne({
                    userId: recipient._id,
                    portfolioId: recipientPortfolio._id,
                    symbol: item.symbol
                });

                if (existingRecipientHolding) {
                    // Merge into existing
                    const newTotal = existingRecipientHolding.shares + transferShares;
                    const newAvg = ((existingRecipientHolding.avgBuyPrice * existingRecipientHolding.shares) + (sourceHolding.avgBuyPrice * transferShares)) / newTotal;
                    existingRecipientHolding.shares = newTotal;
                    existingRecipientHolding.avgBuyPrice = newAvg;
                    await existingRecipientHolding.save();
                } else {
                    // Create new holding for recipient (clone source holding but update owner/portfolio/shares)
                    await Holding.create({
                        userId: recipient._id,
                        portfolioId: recipientPortfolio._id,
                        symbol: sourceHolding.symbol,
                        companyName: sourceHolding.companyName,
                        name: sourceHolding.name || sourceHolding.companyName,
                        sector: sourceHolding.sector,
                        shares: transferShares,
                        avgBuyPrice: sourceHolding.avgBuyPrice,
                        boughtAt: new Date(),
                        // Copy snapshot fields
                        market: sourceHolding.market,
                        price: sourceHolding.price,
                        change: sourceHolding.change,
                        changePercent: sourceHolding.changePercent,
                        volume: sourceHolding.volume,
                        marketCap: sourceHolding.marketCap,
                        peRatio: sourceHolding.peRatio,
                        dividend: sourceHolding.dividend,
                        marketTrend: sourceHolding.marketTrend,
                        description: sourceHolding.description
                    });
                }

                // Update sender's holdings
                if (transferShares >= sourceHolding.shares) {
                    await Holding.deleteOne({ _id: sourceHolding._id });
                } else {
                    sourceHolding.shares -= transferShares;
                    await sourceHolding.save();
                }
            }
        } else {
            // FULL TRANSFER Fallback: Reassign the entire Portfolio and all its Holdings
            // (Used if assets array is empty or not provided)
            const portfolio = await Portfolio.findById(transfer.portfolioId);
            if (portfolio) {
                portfolio.userId = recipient._id;
                await portfolio.save();
            }

            await Holding.updateMany(
                { portfolioId: transfer.portfolioId },
                { $set: { userId: recipient._id } }
            );
        }

        // 3. Complete Transfer record
        transfer.status = "accepted";
        transfer.recipientId = recipient._id;
        transfer.resolvedAt = new Date();
        await transfer.save();

        return corsResponse({
            message: "Portfolio transfer approved and processed successfully.",
            transfer
        }, 200, origin);

    } catch (error: any) {
        console.error("Portfolio Transfer Approval error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
