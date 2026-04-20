import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import TradeRequest from "@/lib/models/TradeRequest";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: any }
) {
    const { id } = await params;
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const body = await request.json();
        console.log("DEBUG: Received Body ->", body);
        const action = body.action?.toLowerCase().trim(); // Forces "APPROVED" to "approved"
        const adminRemarks = body.adminRemarks;

        // const { action, adminRemarks } = await request.json();

        const trade = await TradeRequest.findById(id);

        if (!trade || trade.status !== "pending") {
            throw new Error("Trade not available for processing.");
        }

        // --- 1. REJECTION LOGIC ---
        if (action === "rejected") {
            trade.status = "rejected";
            trade.adminRemarks = adminRemarks || "Rejected by admin.";
            
            if (trade.type === "buy") {
                await User.findByIdAndUpdate(
                    trade.userId,
                    { $inc: { availableCash: trade.totalAmount } }
                );
            }
            await trade.save();
            
            // Explicit return ensures NO approval logic runs
            return corsResponse({ message: "Trade rejected and funds returned." }, 200, origin);
        } 
        
        // --- 2. APPROVAL LOGIC ---
        // We use an "else if" or ensure the action is explicitly "approved"
        if (action === "approved") {
            const portfolio = await Portfolio.findById(trade.portfolioId);
            if (!portfolio) throw new Error("Portfolio not found.");

            const symbolUpper = trade.symbol.toUpperCase();
            const assetIndex = portfolio.assets.findIndex((a: any) => a.symbol === symbolUpper);

            if (trade.type === "buy") {
                if (assetIndex > -1) {
                    const asset = portfolio.assets[assetIndex];
                    const newShares = asset.shares + trade.shares;
                    const newAvg = ((asset.shares * asset.averagePrice) + (trade.shares * trade.pricePerShare)) / newShares;
                    
                    portfolio.assets[assetIndex].shares = newShares;
                    portfolio.assets[assetIndex].averagePrice = newAvg;
                } else {
                    portfolio.assets.push({
                        symbol: symbolUpper,
                        name: trade.companyName,
                        logo: trade.logo,
                        shares: trade.shares,
                        averagePrice: trade.pricePerShare,
                        totalCost: trade.totalAmount,
                        addedAt: new Date()
                    } as any);
                }
            } else if (trade.type === "sell") {
                if (assetIndex === -1 || portfolio.assets[assetIndex].shares < trade.shares) {
                    throw new Error("Insufficient shares in portfolio to execute sale.");
                }

                portfolio.assets[assetIndex].shares -= trade.shares;
                if (portfolio.assets[assetIndex].shares === 0) {
                    portfolio.assets.splice(assetIndex, 1);
                }

                await User.findByIdAndUpdate(
                    trade.userId,
                    { $inc: { availableCash: trade.totalAmount } }
                );
            }

            await portfolio.save();

            await Transaction.create({
                userId: trade.userId,
                portfolioId: trade.portfolioId,
                type: trade.type,
                symbol: symbolUpper,
                amount: trade.totalAmount,
                shares: trade.shares,
                pricePerShare: trade.pricePerShare,
                currency: trade.currency || "USD",
                status: "completed",
                referenceId: `TRADE-${trade._id}`
            });

            trade.status = "approved";
            trade.adminRemarks = adminRemarks || "Trade executed successfully.";
            await trade.save();

            return corsResponse({ message: `Execution of ${symbolUpper} successful` }, 200, origin);
        }

        // If action is neither approved nor rejected
        return corsResponse({ error: "Invalid action provided." }, 400, origin);

    } catch (error: any) {
        console.error("Trade Approval Error:", error);
        return corsResponse({ error: error.message || "Failed to process trade." }, 500, origin);
    }
}