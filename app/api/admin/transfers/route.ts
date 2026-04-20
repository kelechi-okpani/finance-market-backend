import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
// Ensure models are imported to register them in Mongoose (Crucial for .populate)
import "@/lib/models/User"; 
import "@/lib/models/Portfolio"; 
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    
    // 1. Auth Check
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // 2. Query with lean() for performance and explicit population
        // Added .lean() to make the object readable if you need to manipulate it
        const transfers = await PortfolioTransfer.find({})
            .populate({
                path: "senderId",
                select: "firstName lastName email",
                model: "User" // Explicitly stating model name helps if auto-discovery fails
            })
            .populate({
                path: "portfolioId",
                select: "name",
                model: "Portfolio"
            })
            .sort({ createdAt: -1 })
            .lean();

        // 3. Optional: Map data to flatten nested objects for easier frontend use
        const formattedTransfers = transfers.map((t: any) => ({
            ...t,
            senderName: t.senderId ? `${t.senderId.firstName} ${t.senderId.lastName}` : "Unknown User",
            senderEmail: t.senderId?.email,
            portfolioName: t.portfolioId?.name || "Deleted Portfolio",
        }));

        return corsResponse({ transfers: formattedTransfers }, 200, origin);
    } catch (error: any) {
        console.error("Fetch Transfers Error:", error);
        return corsResponse({ error: error.message || "Failed to fetch transfers." }, 500, origin);
    }
}