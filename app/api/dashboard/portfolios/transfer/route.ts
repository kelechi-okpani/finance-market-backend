import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await connectDB();
        const body = await request.json();
        const { portfolioId, recipientEmail, instructions, recipientDetails } = body;

        // 1. Verify ownership and ensure portfolio is active
        const portfolio = await Portfolio.findOne({ 
            _id: portfolioId, 
            userId: auth.user!._id,
            status: 'active' 
        }).session(session);

        if (!portfolio) {
            await session.abortTransaction();
            return corsResponse({ error: "Portfolio not found, unauthorized, or already locked." }, 404, origin);
        }

        if (!portfolio.assets || portfolio.assets.length === 0) {
            await session.abortTransaction();
            return corsResponse({ error: "Cannot transfer an empty portfolio." }, 400, origin);
        }

        // 2. Map embedded assets to the transfer record
        const assetsSnapshot = portfolio.assets.map(asset => ({
            symbol: asset.symbol,
            shares: asset.shares,
            assetName: asset.name,
            averagePrice: asset.averagePrice,
            totalValue: asset.shares * asset.averagePrice // Value at the time of transfer
        }));

        // 3. Create Transfer Request
        const [transfer] = await PortfolioTransfer.create([{
            portfolioId,
            senderId: auth.user!._id,
            recipientEmail: recipientEmail.toLowerCase().trim(),
            recipientFirstName: recipientDetails?.firstName,
            recipientLastName: recipientDetails?.lastName,
            transferInstruction: instructions,
            assets: assetsSnapshot,
            totalAssets: assetsSnapshot.length,
            totalShares: assetsSnapshot.reduce((sum, a) => sum + a.shares, 0),
            totalValue: portfolio.totalValue || assetsSnapshot.reduce((sum, a) => sum + a.totalValue!, 0),
            status: 'pending'
        }], { session });

        // 4. Lock the portfolio to prevent trading during transfer
        portfolio.status = 'pending_transfer';
        await portfolio.save({ session });

        await session.commitTransaction();
        session.endSession();

        return corsResponse({ 
            message: "Transfer initiated and portfolio locked.", 
            transferId: transfer._id 
        }, 201, origin);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transfer Initiation Error:", error);
        return corsResponse({ error: "Failed to initiate transfer." }, 500, origin);
    }
}