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
 * Resets the password using a valid token/OTP.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let body: any = {};
        
        // 1. Check URL search params first (useful for testing)
        const { searchParams } = new URL(request.url);
        const urlToken = searchParams.get("token");
        const urlOtp = searchParams.get("otp");
        const urlNewPassword = searchParams.get("newPassword");
        const urlEmail = searchParams.get("email");

        // 2. Try to get data from JSON body
        try {
            const bodyText = await request.text();
            if (bodyText) {
                body = JSON.parse(bodyText);
            }
        } catch (e) {
            // If body is invalid and no URL params provided, return error
            if (!urlToken && !urlOtp && !urlNewPassword) {
                return corsResponse({ error: "Invalid JSON format." }, 400, origin);
            }
        }

        const token = body.token || urlToken;
        const otp = body.otp || urlOtp;
        const newPassword = body.newPassword || urlNewPassword;
        const email = body.email || urlEmail;
        
        // Support both "token" and "otp" keys for flexibility
        const resetToken = token || otp;

        if (!resetToken || !newPassword) {
            return corsResponse({ error: "Token/OTP and new password are required." }, 400, origin);
        }

        if (newPassword.length < 8) {
            return corsResponse({ error: "Password must be at least 8 characters long." }, 400, origin);
        }

        await connectDB();

        // Build query - if email is provided, use it to ensure we find the right user
        const query: any = {
            resetPasswordToken: String(resetToken).trim(),
            resetPasswordExpires: { $gt: new Date() }
        };
        
        if (email) {
            query.email = email.toLowerCase().trim();
        }

        const user = await User.findOne(query);

        if (!user) {
            console.log(`Reset password failed: Invalid or expired token ${resetToken} for email ${email || 'unknown'}`);
            return corsResponse({ error: "Password reset token is invalid or has expired." }, 400, origin);
        }

        // Hash the new password
        const passwordHash = await hashPassword(newPassword);

        // Update user and clear reset tokens
        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        // Also clear any other flags if applicable
        await user.save();

        console.log(`Password reset successful for user: ${user.email}`);
        return corsResponse({ message: "Password has been reset successfully." }, 200, origin);

    } catch (err: any) {
        console.error("Reset password error:", err);
        return corsResponse({ error: "Failed to reset password", details: err.message }, 500, origin);
    }
}
