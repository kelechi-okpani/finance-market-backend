import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/auth/otp/sms/send
 * Simulates sending an SMS OTP by saving it to the user profile.
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

        // Find user by email or phone
        const query = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        const user = await User.findOne(query);

        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to user profile
        user.smsOTP = otpCode;
        user.smsOTPExpires = expiresAt;
        await user.save();

        return corsResponse(
            { 
                message: "SMS OTP generated successfully (Simulation).",
                developerNote: "In production, this would be sent to the phone. For testing, use the code below.",
                otp: otpCode,
                expiresAt
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Send Error:", error);
        return corsResponse({ error: "Failed to generate SMS OTP.", details: error.message }, 500, origin);
    }
}
