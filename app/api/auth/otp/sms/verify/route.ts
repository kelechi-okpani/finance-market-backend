import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    return POST(request);
}

/**
 * POST /api/auth/otp/sms/verify
 * Verifies the SMS OTP saved on the user profile or account request.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let email: string | undefined;
        let phone: string | undefined;
        let otp: string | undefined;

        // 1. Try to get from JSON body
        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                email = body.email;
                phone = body.phone;
                otp = body.otp;
            }
        } catch (e) {
            // Ignore parse errors
        }

        // 2. Try to get from Query Parameters if not in body
        if ((!email && !phone) || !otp) {
            const { searchParams } = new URL(request.url);
            email = searchParams.get("email") || undefined;
            phone = searchParams.get("phone") || undefined;
            otp = searchParams.get("otp") || undefined;
        }

        if ((!email && !phone) || !otp) {
            return corsResponse({ 
                error: "Email/Phone and OTP are required.",
                details: "Please provide them in the JSON body or as query parameters."
            }, 400, origin);
        }

        await connectDB();

        // Build query with phone normalization logic
        let query: any;
        if (email) {
            query = { email: email.toLowerCase().trim() };
        } else if (phone) {
            const trimmedPhone = phone.trim();
            const phoneVariants = [trimmedPhone];
            if (trimmedPhone.startsWith("0")) {
                phoneVariants.push("+234" + trimmedPhone.slice(1));
            }
            if (trimmedPhone.startsWith("+234")) {
                phoneVariants.push("0" + trimmedPhone.slice(4));
            }
            query = { phone: { $in: phoneVariants } };
        }
        
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
                details: `Please request a new code. (Checked in ${foundIn} document)`
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
