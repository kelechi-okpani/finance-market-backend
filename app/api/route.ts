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
            version: "1.0.0",
            status: "running",
            endpoints: {
                auth: {
                    register: "POST /api/auth/register",
                    login: "POST /api/auth/login",
                    me: "GET /api/auth/me",
                    setup: "POST /api/auth/setup (one-time admin creation)",
                },
                admin: {
                    dashboard: "GET /api/admin/dashboard",
                    requests: "GET /api/admin/requests",
                    reviewRequest: "PUT /api/admin/requests/:id",
                    users: "GET /api/admin/users",
                    updateUser: "PUT /api/admin/users/:id",
                },
                portfolio: "Coming soon",
                market: "Coming soon",
                investments: "Coming soon",
                funds: "Coming soon",
                transfers: "Coming soon",
            },
        },
        200,
        origin
    );
}
