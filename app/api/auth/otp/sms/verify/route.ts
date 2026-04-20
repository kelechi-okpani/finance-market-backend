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

        // 1. Try to get phone and otp (from body or query)
        if (request.method === "POST") {
            try {
                const body = await request.json();
                phone = body.phone;
                otp = body.otp;
            } catch (e) {
                // If JSON fails, it might be empty or malformed
            }
        }

        // 2. Try query params if not in body (or for GET)
        if (!phone || !otp) {
            const { searchParams } = new URL(request.url);
            phone = phone || searchParams.get("phone") || undefined;
            otp = otp || searchParams.get("otp") || undefined;
        }

        if (!phone || !otp) {
            return corsResponse({
                status_code: 400,
                message: "Phone number and OTP are required.",
                details: "Please provide both phone and otp.",
            }, 400, origin);
        }

        // Normalize phone number: remove all non-digit characters except optional leading '+'
        const cleanedPhone = phone.replace(/[^\d+]/g, "");
        let normalizedPhone = cleanedPhone;
        
        // If it starts with '0' and not '+', convert to '+234' (Nigerian default)
        if (cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("+")) {
            normalizedPhone = "+234" + cleanedPhone.slice(1);
        } else if (!cleanedPhone.startsWith("+")) {
            normalizedPhone = "+234" + cleanedPhone;
        }

        console.log(`Verifying SMS OTP for: ${normalizedPhone}`);

        await connectDB();

        // Look up OTP record by phone number
        const otpRecord = await SmsOtp.findOne({ phone: normalizedPhone });

        if (!otpRecord) {
            return corsResponse({
                status_code: 404,
                message: "OTP not found.",
                details: "No OTP was requested for this phone number. Please request a new OTP.",
            }, 404, origin);
        }

        // Check expiry
        if (otpRecord.expiresAt < new Date()) {
            await SmsOtp.deleteOne({ phone: normalizedPhone });
            return corsResponse({
                status_code: 400,
                message: "OTP has expired.",
                details: "Please request a new OTP.",
            }, 400, origin);
        }

        // Check OTP match
        if (otpRecord.otp !== String(otp).trim()) {
            return corsResponse({
                status_code: 400,
                message: "Invalid OTP.",
                details: "The OTP you entered is incorrect. Please try again.",
            }, 400, origin);
        }

        // Success — delete the used OTP record
        await SmsOtp.deleteOne({ phone: normalizedPhone });

        return corsResponse(
            {
                status_code: 200,
                message: "Phone number verified successfully.",
                phone: normalizedPhone,
                verified: true 
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Verify Error:", error);
        return corsResponse({ 
            status_code: 500,
            message: "Failed to verify SMS OTP.", 
            details: error.message 
        }, 500, origin);
    }
}
