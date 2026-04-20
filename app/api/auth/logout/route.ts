import { NextRequest, NextResponse } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        // Create the response object
        const response = corsResponse(
            { 
                status_code: 200, 
                message: "Logged out successfully." 
            },
            200,
            origin
        );

        // If you are using HTTP-only cookies, clear them here:
        // response.cookies.set("token", "", {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     expires: new Date(0), // Set expiration to the past
        //     path: "/",
        // });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return corsResponse(
            { 
                status_code: 500, 
                message: "Internal server error during logout." 
            },
            500,
            origin
        );
    }
}