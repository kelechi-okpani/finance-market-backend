import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import StockTransfer from "@/lib/models/StockTransfer";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { assetSymbol, assetName, shares, valueAtTransfer, toUserEmail } = body;

        if (!assetSymbol || !shares || !toUserEmail) {
            return corsResponse({ error: "Asset symbol, shares, and recipient email are required." }, 400, origin);
        }

        await connectDB();

        // 1. Resolve recipient
        const recipient = await User.findOne({ email: toUserEmail.toLowerCase().trim() });
        if (!recipient) {
            return corsResponse({ error: "Recipient user not found." }, 404, origin);
        }

        // 2. Create StockTransfer record
        const transfer = await StockTransfer.create({
            userId: auth.user!._id,
            assetSymbol: assetSymbol.toUpperCase(),
            assetName: assetName || assetSymbol,
            shares,
            valueAtTransfer: valueAtTransfer || 0,
            fromUser: `${auth.user!.firstName} ${auth.user!.lastName}`,
            toUser: `${recipient.firstName} ${recipient.lastName}`,
            date: new Date().toISOString().split('T')[0],
            status: "pending",
            type: "outbound"
        });

        // Also create an inbound record for the recipient (optional but good for tracking)
        await StockTransfer.create({
            userId: recipient._id,
            assetSymbol: assetSymbol.toUpperCase(),
            assetName: assetName || assetSymbol,
            shares,
            valueAtTransfer: valueAtTransfer || 0,
            fromUser: `${auth.user!.firstName} ${auth.user!.lastName}`,
            toUser: `${recipient.firstName} ${recipient.lastName}`,
            date: new Date().toISOString().split('T')[0],
            status: "pending",
            type: "inbound"
        });

        return corsResponse({
            message: "Stock transfer initiated and pending approval.",
            transfer
        }, 201, origin);

    } catch (error) {
        console.error("Stock Transfer API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
