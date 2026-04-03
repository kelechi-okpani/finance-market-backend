import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/otp/sms/verify
 * Verifies the SMS OTP saved on the user profile or account request.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let body;
        try {
            const bodyText = await request.text();
            if (!bodyText) {
                return corsResponse({ error: "Empty request body.", details: "Please provide email/phone and otp in JSON format." }, 400, origin);
            }
            body = JSON.parse(bodyText);
        } catch (e: any) {
            return corsResponse({ error: "Invalid JSON format.", details: e.message }, 400, origin);
        }

        const { email, phone, otp } = body;

        if ((!email && !phone) || !otp) {
            return corsResponse({ error: "Email/Phone and OTP are required." }, 400, origin);
        }

        await connectDB();

        // Build query
        const query: any = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        
        // 1. Try finding in Users
        let foundIn = "User";
        let user: any = await User.findOne(query);
        let accountReq: any = null;

        if (!user) {
            // 2. Try finding in AccountRequests if not a User yet
            foundIn = "AccountRequest";
            accountReq = await AccountRequest.findOne(query);
        }

        if (!user && !accountReq) {
            return corsResponse({ error: "User or account request not found." }, 404, origin);
        }

        const target = user || accountReq;

        // Check if OTP matches and is not expired
        if (!target.smsOTP || target.smsOTP !== String(otp).trim() || !target.smsOTPExpires || target.smsOTPExpires < new Date()) {
            return corsResponse({ 
                error: "Invalid or expired SMS OTP.",
                details: `Please request a new code. (Stored in ${foundIn} document)`
            }, 400, origin);
        }

        // Success - clear OTP fields
        target.smsOTP = undefined;
        target.smsOTPExpires = undefined;
        await target.save();

        return corsResponse(
            { message: `SMS OTP verified successfully. (Verified in ${foundIn})` },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Verify Error:", error);
        return corsResponse({ error: "Failed to verify SMS OTP.", details: error.message }, 500, origin);
    }
}
