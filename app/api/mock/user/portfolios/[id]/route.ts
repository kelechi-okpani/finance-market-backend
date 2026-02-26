import { NextRequest } from "next/server";
import { mockUsers } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/mock/user/portfolios/[id] - Return a specific mock portfolio
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const mockUser = mockUsers.find(
        u => u.email.toLowerCase() === auth.user!.email.toLowerCase()
    ) || mockUsers[0];

    const portfolio = mockUser.portfolios.find(p => p.id === id);

    if (!portfolio) {
        return corsResponse({ error: "Portfolio not found." }, 404, origin);
    }

    const totalHoldingsValue = portfolio.holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = portfolio.holdings.reduce((sum, h) => sum + (h.avgPrice * h.shares), 0);

    return corsResponse({
        portfolio,
        summary: {
            totalValue: portfolio.totalValue,
            totalGain: portfolio.totalGain,
            gainPercent: portfolio.gainPercent,
            holdingsCount: portfolio.holdings.length,
            totalHoldingsValue,
            totalCost,
        }
    }, 200, origin);
}
