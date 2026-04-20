import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/profile/agreement - Sign the investor agreement
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const user = auth.user!;
        user.agreementSigned = true;
        await user.save();

        return corsResponse({ message: "Agreement signed successfully.", user }, 200, origin);
    } catch (error) {
        console.error("Agreement update error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
