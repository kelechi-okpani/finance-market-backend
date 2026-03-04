import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/reference/genders
 * Returns gender options.
 * Maps to frontend GenderOption interface.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const genders = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
    ];

    return corsResponse({ genders }, 200, origin);
}
