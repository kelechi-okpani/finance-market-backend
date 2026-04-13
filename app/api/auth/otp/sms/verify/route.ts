import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import SmsOtp from "@/lib/models/SmsOtp";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    return POST(request);
}

/**
 * POST /api/auth/otp/sms/verify
 * Verifies the SMS OTP for a given phone number.
 * Does NOT require the user to exist in the database — just validates phone ownership.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let phone: string | undefined;
        let otp: string | undefined;

        // 1. Try to get from JSON body
        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                phone = body.phone;
                otp = body.otp;
            }
        } catch (e) {
            // Ignore parse errors, fall through to query params
        }

        // 2. Try query params if not in body
        if (!phone || !otp) {
            const { searchParams } = new URL(request.url);
            phone = phone || searchParams.get("phone") || undefined;
            otp = otp || searchParams.get("otp") || undefined;
        }

        if (!phone || !otp) {
            return corsResponse({
                error: "Phone number and OTP are required.",
                details: "Please provide both phone and otp in the request body or as query parameters.",
            }, 400, origin);
        }

        // Normalize phone number
        const trimmedPhone = phone.trim();
        let normalizedPhone = trimmedPhone;
        if (trimmedPhone.startsWith("0")) {
            normalizedPhone = "+234" + trimmedPhone.slice(1);
        }

        await connectDB();

        // Look up OTP record by phone number
        const otpRecord = await SmsOtp.findOne({ phone: normalizedPhone });

        if (!otpRecord) {
            return corsResponse({
                error: "OTP not found.",
                details: "No OTP was requested for this phone number. Please request a new OTP.",
            }, 404, origin);
        }

        // Check expiry
        if (otpRecord.expiresAt < new Date()) {
            await SmsOtp.deleteOne({ phone: normalizedPhone });
            return corsResponse({
                error: "OTP has expired.",
                details: "Please request a new OTP.",
            }, 400, origin);
        }

        // Check OTP match
        if (otpRecord.otp !== String(otp).trim()) {
            return corsResponse({
                error: "Invalid OTP.",
                details: "The OTP you entered is incorrect. Please try again.",
            }, 400, origin);
        }

        // Success — delete the used OTP record
        await SmsOtp.deleteOne({ phone: normalizedPhone });

        return corsResponse(
            {
                message: "Phone number verified successfully.",
                phone: normalizedPhone,
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Verify Error:", error);
        return corsResponse({ error: "Failed to verify SMS OTP.", details: error.message }, 500, origin);
    }
}
