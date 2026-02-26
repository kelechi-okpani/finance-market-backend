import { NextRequest } from "next/server";
import { mockUsers } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/mock/user/portfolios - Return mock portfolios for the authenticated user
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const mockUser = mockUsers.find(
        u => u.email.toLowerCase() === auth.user!.email.toLowerCase()
    ) || mockUsers[0];

    return corsResponse({
        portfolios: mockUser.portfolios,
        total: mockUser.portfolios.length,
    }, 200, origin);
}
