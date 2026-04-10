import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || "https://finance-market.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
];

export function corsHeaders(origin?: string | null) {
    let allowedOrigin = ALLOWED_ORIGINS[0];

    if (origin) {
        // More robust matching for local and Vercel environments
        const isAllowed =
            ALLOWED_ORIGINS.includes(origin) ||
            origin.includes(".vercel.app") ||
            /localhost:\d+$/.test(origin) ||
            /127\.0\.0\.1:\d+$/.test(origin) ||
            process.env.NODE_ENV === "development";

        if (isAllowed) {
            allowedOrigin = origin;
        }
    }

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, x-requested-with",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
    };
}

export function corsResponse(
    data: unknown,
    status: number = 200,
    origin?: string | null
) {
    return NextResponse.json(data, {
        status,
        headers: corsHeaders(origin),
    });
}

export function corsOptionsResponse(origin?: string | null) {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}
