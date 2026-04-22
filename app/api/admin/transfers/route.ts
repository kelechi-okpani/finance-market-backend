import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import "@/lib/models/User"; 
import "@/lib/models/Portfolio"; 
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import Portfolio from "@/lib/models/Portfolio";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const transfers = await PortfolioTransfer.find({})
            .populate({ path: "senderId", select: "firstName lastName email" })
            .populate({ path: "portfolioId", select: "name" })
            .sort({ createdAt: -1 })
            .lean();

        // Optional: Flatten for Admin Table
        const formatted = transfers.map((t: any) => ({
            ...t,
            senderName: `${t.senderId?.firstName || 'System'} ${t.senderId?.lastName || ''}`,
            senderEmail: t.senderId?.email,
            portfolioName: t.portfolioId?.name || "Deleted Portfolio"
        }));

        return corsResponse({ transfers: formatted }, 200, origin);
    } catch (error: any) {
        return corsResponse({ error: error.message }, 500, origin);
    }
}

