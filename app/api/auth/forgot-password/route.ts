import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
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

        const emailLower = email.toLowerCase().trim();

        // 1. Check if they have a pending account request
        const accountReq = await AccountRequest.findOne({ email: emailLower });
        if (accountReq && accountReq.status !== "approved") {
            return corsResponse({ 
                message: `Your account request is currently ${accountReq.status}. You will be able to set your password once it is approved.`,
                status: accountReq.status
            }, 200, origin);
        }

        // 2. Look for existing approved user
        const user = await User.findOne({ email: emailLower });

        // Security best practice: Don't reveal if user exists in production.
        // But for this demo/app, we'll return a helpful message if not found.
        if (!user) {
            return corsResponse({ 
                message: "No approved account was found with that email address.",
                details: accountReq ? "An account request exists but hasn't been fully activated into a user yet." : "No record found."
            }, 200, origin);
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        // Send the email
        const mailResult = await sendPasswordResetEmail(user.email, resetToken);

        if (!mailResult.success) {
            return corsResponse({ 
                error: "Failed to send reset email.",
                details: (mailResult.error as any)?.message || "Check SMTP configuration on the server.",
                developerNote: "If testing locally, unset SMTP_HOST to use simulation mode.",
            }, 500, origin);
        }

        const isSimulated = mailResult.message === "Simulation successful.";

        return corsResponse({ 
            message: "If an account with that email exists, we have sent a reset link.",
            ...(isSimulated && { dev_simulated_token: resetToken })
        }, 200, origin);

    } catch (err: any) {
        console.error("Forgot password error:", err);
        return corsResponse({ error: "Failed to process request", details: err.message }, 500, origin);
    }
}
