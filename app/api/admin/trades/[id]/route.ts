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
                  
                // if (assetIndex > -1) {
                //     const asset = portfolio.assets[assetIndex];
                //     const newShares = asset.shares + trade.shares;
                //     const newAvg = ((asset.shares * asset.averagePrice) + (trade.shares * trade.price)) / newShares;
                    
                //     portfolio.assets[assetIndex].shares = newShares;
                //     portfolio.assets[assetIndex].averagePrice = newAvg;
                // } else {
                //     portfolio.assets.push({
                //      symbol: symbolUpper,
                //         name: trade.name,
                //         logo: trade.logo,
                //         industry: trade.industry, // Added industry tracking

                //         // Position Data
                //         shares: trade.shares,
                //         averagePrice: trade.price,
                //         totalCost: trade.totalAmount,
                        
                //         // Market Snapshot (Staged from Cart -> Trade -> Portfolio)
                //         change_percent: trade.change_percent,
                //         marketCap: trade.marketCap,
                //         assetType: trade.type,
                    
                //         // Metadata
                //         addedAt: new Date(),
                //         lastUpdated: new Date()
                //     } as any);
                // }

                console.log(trade.price, "trade.price")
                    if (assetIndex > -1) {
                        // 1. UPDATE EXISTING ASSET POSITION
                        const asset = portfolio.assets[assetIndex];
                        const newShares = asset.shares + trade.shares;
                        
                        // Weighted Average Cost calculation: ((Old Qty * Old Price) + (New Qty * New Price)) / Total Qty
                        const newAvg = ((asset.shares * asset.averagePrice) + (trade.shares * trade.price)) / newShares;
                        
                       
                        // Financial Update
                        portfolio.assets[assetIndex].shares = newShares;
                        portfolio.assets[assetIndex].averagePrice = newAvg;
                        portfolio.assets[assetIndex].price = trade.price;
                   
                        portfolio.assets[assetIndex].totalCost = Number((newShares * newAvg).toFixed(2));

                        // Identity Refresh (in case of name/logo updates)
                        portfolio.assets[assetIndex].name = trade.name || asset.name;
                        portfolio.assets[assetIndex].logo = trade.logo || asset.logo;
                        portfolio.assets[assetIndex].industry = trade.industry || asset.industry;

                        portfolio.assets[assetIndex].change = trade.change;
                        portfolio.assets[assetIndex].change_percent = trade.change_percent;
                        portfolio.assets[assetIndex].marketCap = trade.marketCap;
                        portfolio.assets[assetIndex].high = trade.high;
                        portfolio.assets[assetIndex].low = trade.low;
                        portfolio.assets[assetIndex].open = trade.open;
                        portfolio.assets[assetIndex].prev_close = trade.prev_close;
                        portfolio.assets[assetIndex].lastUpdated = new Date();
                       
                        } else {
                            // 2. PUSH NEW ASSET POSITION (Clean Slate)
                            portfolio.assets.push({
                                symbol: symbolUpper,
                                name: trade.name,
                                logo: trade.logo,
                                industry: trade.industry,
                                shares: trade.shares,
                                averagePrice: trade.price,
                                price: trade.price,
                                totalCost: trade.totalAmount,
                                currency: trade.currency || "USD",
                                change: trade.change,
                                change_percent: trade.change_percent,
                                marketCap: trade.marketCap,
                                high: trade.high,
                                low: trade.low,
                                open: trade.open,
                                prev_close: trade.prev_close,
                                type: trade.type,
                                addedAt: new Date(),
                                lastUpdated: new Date()
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

                     portfolio.assets = portfolio.assets.map((asset: any) => {
                            if (asset.price === undefined || asset.price === null) {
                                asset.price = trade.price
                            }
                            return asset;
                        });

            await portfolio.save();

          await Transaction.create({
                userId: trade.userId,
                portfolioId: trade.portfolioId,
                type: trade.type,
                symbol: symbolUpper,
                amount: trade.totalAmount,
                shares: trade.shares,
                price: trade.price,
                currency: trade.currency || "USD",
                status: "completed",
                // Creates a professional reference like TRQ-A1B2C3
                referenceId: `TRQ-${trade._id.toString().toUpperCase().slice(-6)}` 
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