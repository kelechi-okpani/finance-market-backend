import { NextRequest } from "next/server";
import { mockUsers } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/mock/user - Return the mock dataset user matching by email, or first user as demo
// This endpoint hydrates the frontend with the rich mock data from the dataset.
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    // Try to find a mock user matching the authenticated user's email
    const mockUser = mockUsers.find(
        u => u.email.toLowerCase() === auth.user!.email.toLowerCase()
    ) || mockUsers[0]; // Fall back to first demo user

    // Return the full rich mock dataset for this user without sensitive info
    return corsResponse({
        mockProfile: {
            id: mockUser.id,
            fullName: mockUser.fullName,
            email: mockUser.email,
            phone: mockUser.phone,
            country: mockUser.country,
            dateOfBirth: mockUser.dateOfBirth,
            address: mockUser.address,
            occupation: mockUser.occupation,
            status: mockUser.status,
            kycCompleted: mockUser.kycCompleted,
            agreementSigned: mockUser.agreementSigned,
            accountBalance: mockUser.accountBalance,
            createdAt: mockUser.createdAt,
        },
        portfolios: mockUser.portfolios,
        transactions: mockUser.transactions,
        savedPaymentMethods: mockUser.savedPaymentMethods,
        summary: {
            totalPortfolioValue: mockUser.portfolios.reduce((sum, p) => sum + p.totalValue, 0),
            totalGain: mockUser.portfolios.reduce((sum, p) => sum + p.totalGain, 0),
            totalHoldings: mockUser.portfolios.reduce((sum, p) => sum + p.holdings.length, 0),
            activePortfolios: mockUser.portfolios.filter(p => p.status === "active").length,
            accountBalance: mockUser.accountBalance,
        }
    }, 200, origin);
}
