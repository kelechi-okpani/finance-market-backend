import { NextRequest } from "next/server";
import { mockUsers } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/mock/user/transactions?type=deposit&limit=20
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const mockUser = mockUsers.find(
        u => u.email.toLowerCase() === auth.user!.email.toLowerCase()
    ) || mockUsers[0];

    let transactions = [...mockUser.transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (type) transactions = transactions.filter(t => t.type === type);

    const totalDeposited = mockUser.transactions.filter(t => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = mockUser.transactions.filter(t => t.type === "withdrawal").reduce((sum, t) => sum + t.amount, 0);
    const totalInvested = mockUser.transactions.filter(t => t.type === "buy").reduce((sum, t) => sum + t.amount, 0);

    return corsResponse({
        transactions: transactions.slice(0, limit),
        total: transactions.length,
        summary: {
            totalDeposited,
            totalWithdrawn,
            totalInvested,
            accountBalance: mockUser.accountBalance,
        }
    }, 200, origin);
}
