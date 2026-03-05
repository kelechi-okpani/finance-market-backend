import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { hashPassword } from "@/lib/auth";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/reset-password
 * Resets the password using a valid token.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return corsResponse({ error: "Token and new password are required." }, 400, origin);
        }

        if (newPassword.length < 8) {
            return corsResponse({ error: "Password must be at least 8 characters long." }, 400, origin);
        }

        await connectDB();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return corsResponse({ error: "Password reset token is invalid or has expired." }, 400, origin);
        }

        // Hash the new password
        const passwordHash = await hashPassword(newPassword);

        // Update user and clear reset tokens
        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return corsResponse({ message: "Password has been reset successfully." }, 200, origin);

    } catch (err: any) {
        console.error("Reset password error:", err);
        return corsResponse({ error: "Failed to reset password", details: err.message }, 500, origin);
    }
}
