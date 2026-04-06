import { NextRequest } from "next/server";
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import User from "@/lib/models/User";
import connectDB from "@/lib/db";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/profile/password - Change user password
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return corsResponse({ error: "Current and new password are required." }, 400, origin);
        }

        if (newPassword.length < 8) {
            return corsResponse({ error: "New password must be at least 8 characters long." }, 400, origin);
        }

        await connectDB();
        const user = auth.user!;

        // Check current password (need to re-fetch user with passwordHash since it's excluded by default)
        const userWithPass = await User.findById(user._id).select("+passwordHash");

        if (!userWithPass || !userWithPass.passwordHash) {
             return corsResponse({ error: "User not found or password not set." }, 404, origin);
        }

        const isValid = await verifyPassword(currentPassword, userWithPass.passwordHash);
        if (!isValid) {
            return corsResponse({ error: "Invalid current password." }, 401, origin);
        }

        userWithPass.passwordHash = await hashPassword(newPassword);
        await userWithPass.save();

        return corsResponse({ message: "Password updated successfully." }, 200, origin);
    } catch (error: any) {
        console.error("Password update error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
