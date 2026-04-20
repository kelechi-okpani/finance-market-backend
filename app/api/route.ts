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
                    kyc: "POST /api/onboarding/kyc — unified KYC onboarding",
                },
                user: {
                    dashboard: "GET /api/dashboard",
                    market: "GET /api/dashboard/market",
                    market_one: "GET /api/dashboard/market/:id",

                
                   deposit: "GET /api/dashboard/funds/deposit",
                   resettlement: "GET /api/dashboard/funds/resettlement",
                   withdrawal: "GET /api/dashboard/funds/withdrawal",


                    new_portfolio: "POST  /api/dashboard/portfolios",
                    get_portfolio: "GET  /api/dashboard/portfolios",
                    get_one_portfolio: "GET  /api/dashboard/portfolios/:id",
                    transfer_porfolio: "POST /api/dashboard/portfolios/transfer",

                    
                    data: "GET /api/user/data — returns { Portfolio, Investment, Transaction }",

                 

                   cart_item: "api/cart/:id",
                   cart: "api/dashboard/cart/",
                   cart_checkout: "api/dashboard/cart/checkout",





                  
                },

                admin: {
                    dashboard: "GET /api/admin/overview",
                    requests: "GET /api/admin/requests (List account requests)",
                    reviewRequest: "PUT /api/admin/requests/:id (Approve/Reject)",

                    users: "GET /api/admin/users",
                    users_one: "GET /api/admin/users/:id",

                    updateUser: "PUT /api/admin/users/:id",


                    kyc: "GET /api/admin/kyc (List users + their KYC docs)",
                    market: "GET /api/admin/finance",
                    market_one: "GET /api/admin/finance/:id",
                    settings: "GET/PUT /api/admin/settings (Site-wide controls)",


                    trade: "GET /api/admin/trades",
                    trade_one: "GET /api/admin/trades/:id",

                    portolio_transfer: "GET /api/admin/transfers",
                    portolio_transfer_one: "PATCH /api/admin/transfers/:id",


                   inheritance: "/api/inheritance",

                },

              
               
             
           
              
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
