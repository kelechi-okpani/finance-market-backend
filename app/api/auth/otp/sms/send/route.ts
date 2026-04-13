import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import SmsOtp from "@/lib/models/SmsOtp";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    return POST(request);
}

/**
 * POST /api/auth/otp/sms/send
 * Sends an SMS OTP to verify phone number ownership.
 * Does NOT require the user to already exist in the database.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let phone: string | undefined;

        // 1. Try to get from JSON body
        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                phone = body.phone;
            }
        } catch (e) {
            // Ignore parse errors, fall through to query params
        }

        // 2. Try query params if not in body
        if (!phone) {
            const { searchParams } = new URL(request.url);
            phone = searchParams.get("phone") || undefined;
        }

        if (!phone) {
            return corsResponse({
                error: "Phone number required.",
                details: "Please provide a phone number in the request body or as a query parameter.",
            }, 400, origin);
        }

        // Normalize phone number
        const trimmedPhone = phone.trim();
        let normalizedPhone = trimmedPhone;
        if (trimmedPhone.startsWith("0")) {
            normalizedPhone = "+234" + trimmedPhone.slice(1);
        }

        await connectDB();

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert OTP record keyed by phone number (no user lookup needed)
        await SmsOtp.findOneAndUpdate(
            { phone: normalizedPhone },
            { phone: normalizedPhone, otp: otpCode, expiresAt, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // TODO: Integrate a real SMS provider (e.g. Termii, Twilio) here
        // For now, the OTP is returned in the response for development/testing
        return corsResponse(
            {
                message: "OTP sent successfully.",
                developerNote: "For testing, the OTP is returned below. Replace with real SMS delivery in production.",
                otp: otpCode,
                phone: normalizedPhone,
                expiresAt,
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Send Error:", error);
        return corsResponse({ error: "Failed to send SMS OTP.", details: error.message }, 500, origin);
    }
}
