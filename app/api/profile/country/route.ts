import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/profile/country - Set user country
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { country } = body;

        if (!country) {
            return corsResponse({ error: "Country is required." }, 400, origin);
        }

        const user = auth.user!;
        user.country = country.trim();
        await user.save();

        return corsResponse({ 
            message: "Country set successfully.", 
            country: user.country 
        }, 200, origin);
    } catch (error) {
        console.error("Set country error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
