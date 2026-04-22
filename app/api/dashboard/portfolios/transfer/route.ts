import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAuth } from "@/lib/auth";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";
import User from "@/lib/models/User";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}


export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { portfolioId, recipientEmail, instructions, recipientDetails } = await request.json();

    // 1. Find the specific portfolio using the ID and ensure it belongs to the sender
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      userId: auth.user!._id,
      status: "active",
    });

    if (!portfolio) {
      return corsResponse({ error: "Active portfolio not found." }, 404, origin);
    }

    if (!portfolio.assets || portfolio.assets.length === 0) {
      return corsResponse({ error: "Cannot transfer an empty portfolio." }, 400, origin);
    }

    // 2. Validate the recipient exists
    const normalizedEmail = recipientEmail.toLowerCase().trim();
    const recipientUser = await User.findOne({ email: normalizedEmail });

    if (!recipientUser) {
      return corsResponse({ error: "Recipient is not a registered user." }, 404, origin);
    }

        const assetsSnapshot = portfolio.assets.map((asset: any) => {
            // Ensure we have numbers to work with (fallback to 0 if missing)
            const shares = Number(asset.shares) || 0;
            const price = Number(asset.price) || Number(asset.averagePrice) || 0;
            const averagePrice = Number(asset.averagePrice) || 0;

            return {
                symbol: asset.symbol,
                name: asset.name,
                logo: asset.logo,
                type: asset.type,
                industry: asset.industry,
                shares: shares,
                averagePrice: averagePrice,
                price: price,
                // Calculate totalValue safely
                totalValue: shares * price, 
                totalCost: shares * averagePrice,
                currency: asset.currency || 'USD',

                // Fallbacks for other required numerical fields
                change: Number(asset.change) || 0,
                change_percent: Number(asset.change_percent) || 0,
                marketCap: Number(asset.marketCap) || 0,
                high: Number(asset.high) || 0,
                low: Number(asset.low) || 0,
                open: Number(asset.open) || 0,
                prev_close: Number(asset.prev_close) || 0,

                // Metadata
                addedAt: asset.addedAt,
                lastUpdated: asset.lastUpdated || new Date(),
                 };
            });

        // 4. Calculate totals for the transfer document
        const totalShares = assetsSnapshot.reduce((sum: number, a: any) => sum + a.shares, 0);
        const calculatedTotalValue = assetsSnapshot.reduce((sum: number, a: any) => sum + a.totalValue, 0);

        // 5. Create the Transfer Record
        const transfer = await PortfolioTransfer.create({
        portfolioId: portfolio._id,
        senderId: auth.user!._id,
        recipientId: recipientUser._id,
        recipientEmail: normalizedEmail,
        recipientFirstName: recipientDetails?.firstName,
        recipientLastName: recipientDetails?.lastName,
        transferInstruction: instructions,
        assets: assetsSnapshot,
        totalAssets: assetsSnapshot.length,
        totalShares: totalShares,
        totalValue: calculatedTotalValue || portfolio.totalValue, // Fallback to portfolio's stored value
        status: "pending",
        });

    // 6. Lock the portfolio status to prevent further trading during migration
    portfolio.status = "pending_transfer";
    await portfolio.save();

    return corsResponse(
      { 
        message: "Portfolio migration initiated successfully", 
        transferId: transfer._id 
      }, 
      201, 
      origin
    );

  } catch (error: any) {
    console.error("TRANSFER_LOGIC_ERROR:", error.message);
    return corsResponse({ error: error.message }, 500, origin);
  }
}



export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Strict filter: User must be sender OR recipient email must match
        const userEmail = auth.user!.email.toLowerCase();
        
        const transfers = await PortfolioTransfer.find({
            $or: [
                { senderId: auth.user!._id },
                { recipientEmail: userEmail }
            ]
        })
        .populate({ path: "senderId", select: "firstName lastName email" })
        .populate({ path: "portfolioId", select: "name" })
        .sort({ createdAt: -1 })
        .lean();

        // Helper: Flag incoming vs outgoing for the UI
        const formatted = transfers.map((t: any) => ({
            ...t,
            direction: t.recipientEmail === userEmail ? 'incoming' : 'outgoing',
            portfolioName: t.portfolioId?.name || "Portfolio"
        }));

        return corsResponse({ transfers: formatted }, 200, origin);
    } catch (error: any) {
        return corsResponse({ error: error.message }, 500, origin);
    }
}