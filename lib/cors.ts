import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || "https://stock-portfolio-ruby-five.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
];

export function corsHeaders(origin?: string | null) {
    let allowedOrigin = ALLOWED_ORIGINS[0];

    if (origin) {
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
            allowedOrigin = origin;
        }
    }

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
