import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import Holding from "@/lib/models/Holding";
import { requireApproved } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/portfolios - List user's portfolios
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Find all portfolios for the authenticated user
        const portfolios = await Portfolio.find({ userId: auth.user!._id }).sort({ createdAt: -1 });

        // For each portfolio, we might want to get aggregate stats (coming in a summary endpoint later)
        // but for now, we just return the list
        return corsResponse({ portfolios }, 200, origin);
    } catch (error) {
        console.error("List portfolios error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/portfolios - Create a new portfolio
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireApproved(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { name, description, type } = body;

        if (!name) {
            return corsResponse({ error: "Portfolio name is required." }, 400, origin);
        }

        await connectDB();

        // SINGLE PORTFOLIO ENFORCEMENT
        const existingPortfolio = await Portfolio.findOne({ userId: auth.user!._id });
        if (existingPortfolio) {
            return corsResponse({ 
                error: "Multiple portfolios are not allowed. You already have a portfolio.",
                portfolio: existingPortfolio 
            }, 400, origin);
        }

        const portfolio = await Portfolio.create({
            userId: auth.user!._id,
            name: name?.trim() || "Main Portfolio",
            description: description?.trim(),
            type: type || 'stocks',
            status: 'active',
            source: 'created',
        });

        return corsResponse(
            {
                message: "Portfolio created successfully.",
                portfolio
            },
            201,
            origin
        );
    } catch (error) {
        console.error("Create portfolio error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
