import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api - Health check & API info
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    return corsResponse(
        {
            name: "VaultStock API",
            version: "2.0.0",
            status: "running",
            endpoints: {
                auth: {
                    register: "POST /api/auth/register",
                    login: "POST /api/auth/login — payload: { email, password }",
                    me: "GET /api/auth/me — returns nested User object",
                    setup: "POST /api/auth/setup (one-time admin creation)",
                    forgotPassword: "POST /api/auth/forgot-password — payload: { email }",
                    resetPassword: "POST /api/auth/reset-password — payload: { token, newPassword }",
                },
                user: {
                    data: "GET /api/user/data — returns { Portfolio, Investment, Transaction }",
                },
                admin: {
                    dashboard: "GET /api/admin/dashboard",
                    requests: "GET /api/admin/requests (List account requests)",
                    reviewRequest: "PUT /api/admin/requests/:id (Approve/Reject)",
                    users: "GET /api/admin/users",
                    updateUser: "PUT /api/admin/users/:id",
                    kyc: "GET /api/admin/kyc (List users + their KYC docs)",
                    market: "GET /api/admin/market/stocks (Manage market data)",
                    settings: "GET/PUT /api/admin/settings (Site-wide controls)",
                },
                onboarding: {
                    kyc: "POST /api/onboarding/kyc — unified KYC onboarding",
                    step7: "POST /api/onboarding/step7",
                    step8: "POST /api/onboarding/step8",
                    step9: "POST /api/onboarding/step9",
                    step10: "POST /api/onboarding/step10",
                    "step11-12": "POST /api/onboarding/step11-12",
                    "step13-14": "POST /api/onboarding/step13-14",
                    step15: "POST /api/onboarding/step15",
                    status: "GET /api/onboarding/status",
                },
                dashboard: "GET /api/dashboard",
                portfolio: "GET/POST /api/portfolios",
                market: {
                    stocks: "GET /api/market/stocks",
                    bonds: "GET /api/market/bonds",
                    etfs: "GET /api/market/etfs",
                    mutualFunds: "GET /api/market/mutual-funds",
                    commodities: "GET /api/market/commodities",
                    search: "GET /api/market/search?q=...",
                    screener: "GET /api/market/screener",
                },
                investments: "GET /api/investments",
                funds: {
                    summary: "GET /api/funds",
                    transaction: "POST /api/funds",
                    paymentMethods: "GET/POST /api/funds/payment-methods",
                },
                transfers: {
                    list: "GET /api/transfers",
                    initiate: "POST /api/transfers",
                    respond: "PUT /api/transfers/:id",
                },
                profile: {
                    get: "GET /api/profile",
                    update: "PUT /api/profile",
                    password: "PUT /api/profile/password",
                    kyc: "GET /api/profile/kyc",
                    agreement: "GET /api/profile/agreement",
                },
                reference: {
                    locations: "GET /api/reference/locations",
                    genders: "GET /api/reference/genders",
                },
            },
        },
        200,
        origin
    );
}
