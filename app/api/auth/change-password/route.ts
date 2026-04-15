import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/auth/change-password
 * Changes a logged-in user's password.
 */
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return corsResponse({ 
                status_code: 400,
                message: "Current and new passwords are required." 
            }, 400, origin);
        }

        if (newPassword.length < 8) {
            return corsResponse({ 
                status_code: 400,
                message: "New password must be at least 8 characters long." 
            }, 400, origin);
        }

        await connectDB();

        // Get fresh user with passwordHash
        const user = await User.findById(auth.user!._id);
        if (!user) {
            return corsResponse({ 
                status_code: 404,
                message: "User not found." 
            }, 404, origin);
        }

        // Verify current password
        const isMatch = await verifyPassword(currentPassword, user.passwordHash);
        if (!isMatch) {
            return corsResponse({ 
                status_code: 401,
                message: "Incorrect current password." 
            }, 401, origin);
        }

        // Update with new password hash
        user.passwordHash = await hashPassword(newPassword);
        await user.save();

        return corsResponse({ 
            status_code: 200,
            message: "Password updated successfully." 
        }, 200, origin);

    } catch (error: any) {
        console.error("Change password error:", error);
        return corsResponse({ 
            status_code: 500,
            message: "Failed to change password.", 
            details: error.message 
        }, 500, origin);
    }
}
