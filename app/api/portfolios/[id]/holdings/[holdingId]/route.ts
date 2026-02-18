import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Holding from "@/lib/models/Holding";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/portfolios/[id]/holdings/[holdingId] - Update specific holding
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; holdingId: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id: portfolioId, holdingId } = await params;
        const body = await request.json();
        const { shares, avgBuyPrice, targetReturn } = body;

        await connectDB();

        const holding = await Holding.findOneAndUpdate(
            { _id: holdingId, portfolioId, userId: auth.user!._id },
            {
                $set: {
                    ...(shares !== undefined && { shares }),
                    ...(avgBuyPrice !== undefined && { avgBuyPrice }),
                    ...(targetReturn !== undefined && { targetReturn }),
                }
            },
            { new: true }
        );

        if (!holding) {
            return corsResponse({ error: "Holding not found." }, 404, origin);
        }

        return corsResponse({ message: "Holding updated successfully.", holding }, 200, origin);
    } catch (error) {
        console.error("Update holding error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// DELETE /api/portfolios/[id]/holdings/[holdingId] - Remove holding
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; holdingId: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id: portfolioId, holdingId } = await params;

        await connectDB();

        const holding = await Holding.findOneAndDelete({
            _id: holdingId,
            portfolioId,
            userId: auth.user!._id,
        });

        if (!holding) {
            return corsResponse({ error: "Holding not found." }, 404, origin);
        }

        return corsResponse({ message: "Holding removed successfully." }, 200, origin);
    } catch (error) {
        console.error("Delete holding error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
