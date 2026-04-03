import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AccountRequest from "@/lib/models/AccountRequest";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/otp/sms/send
 * Simulates sending an SMS OTP by saving it to the user profile or account request.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let body;
        try {
            const bodyText = await request.text();
            if (!bodyText) {
                return corsResponse({ error: "Empty request body.", details: "Please provide email or phone in JSON format." }, 400, origin);
            }
            body = JSON.parse(bodyText);
        } catch (e: any) {
            return corsResponse({ error: "Invalid JSON format.", details: e.message }, 400, origin);
        }

        const { email, phone } = body;

        if (!email && !phone) {
            return corsResponse({ error: "Email or phone is required to identify user." }, 400, origin);
        }

        await connectDB();

        // Build query
        const query: any = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        
        // 1. Try finding in Users
        let user: any = await User.findOne(query);
        let accountReq: any = null;

        if (!user) {
            // 2. Try finding in AccountRequests if not a User yet
            accountReq = await AccountRequest.findOne(query);
        }

        if (!user && !accountReq) {
            return corsResponse({ 
                error: "User or account request not found.", 
                details: "No record matches the provided email or phone number in either the User or AccountRequest collections." 
            }, 404, origin);
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for better reliability

        // Save to whichever one we found
        if (user) {
            user.smsOTP = otpCode;
            user.smsOTPExpires = expiresAt;
            await user.save();
        } else if (accountReq) {
            accountReq.smsOTP = otpCode;
            accountReq.smsOTPExpires = expiresAt;
            await accountReq.save();
        }

        return corsResponse(
            { 
                message: "SMS OTP generated successfully (Simulation).",
                developerNote: "For testing, use the code below. If you don't receive it, verify the details in the database.",
                otp: otpCode,
                expiresAt,
                storedIn: user ? "User" : "AccountRequest"
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Send Error:", error);
        return corsResponse({ error: "Failed to generate SMS OTP.", details: error.message }, 500, origin);
    }
}
