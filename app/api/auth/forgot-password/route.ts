import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { sendPasswordResetOTPEmail } from "@/lib/mail";

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
        let email: string | null = null;

        // 1. Try to get email from URL search params (useful for quick testing)
        const { searchParams } = new URL(request.url);
        email = searchParams.get("email");

        // 2. Try to get email from JSON body (standard way)
        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                if (body.email) email = body.email;
            }
        } catch (e) {
            // Ignore parse errors if we already got email from URL
            if (!email) {
                return corsResponse({
                    status_code: 400,
                    message: "Invalid email format.",
                    details: "Please provide email in JSON body or as a query parameter."
                }, 400, origin);
            }
        }

        if (!email) {
            return corsResponse({
                status_code: 400,
                message: "Email is required."
            }, 400, origin);
        }

        await connectDB();

        const emailLower = email.toLowerCase().trim();

        // 1. Check if they have a pending account request
        const accountReq = await AccountRequest.findOne({ email: emailLower });
        if (accountReq && accountReq.status !== "approved") {
            console.log(`Forgot password attempt for pending/rejected account: ${emailLower} (Status: ${accountReq.status})`);
            return corsResponse({
                status_code: 404,
                message: `Your account request is currently ${accountReq.status}. You will be able to set your password once it is approved.`,
                status: accountReq.status
            }, 404, origin);
        }

        // 2. Look for existing approved user
        const user = await User.findOne({ email: emailLower });

        // Security best practice: Don't reveal if user exists in production.
        // But for this demo/app, we'll return a helpful message if not found.
        if (!user) {
            console.log(`Forgot password attempt for non-existent user: ${emailLower}`);
            return corsResponse({
                status_code: 404,
                message: "No approved account was found with that email address.",
                details: accountReq ? "An account request exists but hasn't been fully activated into a user yet." : "No record found."
            }, 404, origin);
        }

        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now (increased for reliability)

        user.resetPasswordToken = otpCode;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        // Send the email
        console.log(`Attempting to send reset OTP email to ${user.email}...`);
        const mailResult = await sendPasswordResetOTPEmail(user.email, otpCode, user.firstName);

        if (!mailResult.success) {
            console.error(`Failed to send reset email to ${user.email}:`, mailResult.error);
            return corsResponse({
                status_code: 500,
                message: "Failed to send reset email.",
                details: (mailResult.error as any)?.message || "Check SMTP configuration on the server.",
                developerNote: "If testing locally, unset SMTP_HOST to use simulation mode.",
            }, 500, origin);
        }

        const isSimulated = mailResult.message === "Simulation successful.";
        if (isSimulated) {
            console.log(`[SIMULATION] Reset OTP for ${user.email}: ${otpCode}`);
        } else {
            console.log(`Reset OTP email successfully sent to ${user.email}`);
        }

        return corsResponse({
            status_code: 200,
            message: "We have sent a reset code to your email address.",
            ...(isSimulated && { dev_simulated_otp: otpCode })
        }, 200, origin);

    } catch (err: any) {
        console.error("Forgot password error:", err);
        return corsResponse({
            status_code: 500,
            message: "Failed to process request",
            details: err.message
        }, 500, origin);
    }
}
