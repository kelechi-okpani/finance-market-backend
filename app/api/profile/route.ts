import { NextRequest } from "next/server";
import { requireAuth, hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/profile - Full profile info
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    return corsResponse({ user: auth.user }, 200, origin);
}

// PUT /api/profile - Update personal info
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { firstName, lastName, phone } = body;

        const user = auth.user!;
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone !== undefined) user.phone = phone.trim();

        await user.save();

        return corsResponse({ message: "Profile updated successfully.", user }, 200, origin);
    } catch (error) {
        console.error("Profile update error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
