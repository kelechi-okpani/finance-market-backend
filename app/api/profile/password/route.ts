import { NextRequest } from "next/server";
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

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
            return corsResponse({ error: "New password must be at least 8 characters." }, 400, origin);
        }

        const user = auth.user!;

        // Check current password (need to re-fetch user with passwordHash since it's excluded by default)
        // Actually, in lib/auth.ts getAuthUser, I selected everything. Let's re-verify.
        // getAuthUser uses .select("-passwordHash"). So I need to fetch it here.
        const User = user.constructor as any;
        const userWithPass = await User.findById(user._id).select("+passwordHash");

        const isValid = await verifyPassword(currentPassword, userWithPass.passwordHash);
        if (!isValid) {
            return corsResponse({ error: "Invalid current password." }, 401, origin);
        }

        userWithPass.passwordHash = await hashPassword(newPassword);
        await userWithPass.save();

        return corsResponse({ message: "Password updated successfully." }, 200, origin);
    } catch (error) {
        console.error("Password update error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
