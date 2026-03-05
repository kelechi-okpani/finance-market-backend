import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/forgot-password
 * Initiates the password reset process by sending an email with a token.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const { email } = await request.json();

        if (!email) {
            return corsResponse({ error: "Email is required." }, 400, origin);
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Security best practice: Don't reveal if user exists.
        // But for this demo/app, we'll return success regardless.
        if (!user) {
            return corsResponse({ message: "If an account with that email exists, we have sent a reset link." }, 200, origin);
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        // Send the email (simulated)
        await sendPasswordResetEmail(user.email, resetToken);

        return corsResponse({ message: "If an account with that email exists, we have sent a reset link." }, 200, origin);

    } catch (err: any) {
        console.error("Forgot password error:", err);
        return corsResponse({ error: "Failed to process request", details: err.message }, 500, origin);
    }
}
