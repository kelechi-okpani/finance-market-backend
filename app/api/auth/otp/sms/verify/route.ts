import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/otp/sms/verify
 * Verifies the SMS OTP saved on the user profile.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return corsResponse({ error: "Invalid JSON body or empty request." }, 400, origin);
    }
        const { email, phone, otp } = body;

        if ((!email && !phone) || !otp) {
            return corsResponse({ error: "Email/Phone and OTP are required." }, 400, origin);
        }

        await connectDB();

        // Find user
        const query = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        const user = await User.findOne(query);

        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Check if OTP matches and is not expired
        if (!user.smsOTP || user.smsOTP !== String(otp).trim() || !user.smsOTPExpires || user.smsOTPExpires < new Date()) {
            return corsResponse({ 
                error: "Invalid or expired SMS OTP.",
                details: "Please request a new code if this persists."
            }, 400, origin);
        }

        // Success - clear OTP fields
        user.smsOTP = undefined;
        user.smsOTPExpires = undefined;
        await user.save();

        return corsResponse(
            { message: "SMS OTP verified successfully." },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Verify Error:", error);
        return corsResponse({ error: "Failed to verify SMS OTP.", details: error.message }, 500, origin);
    }
}
