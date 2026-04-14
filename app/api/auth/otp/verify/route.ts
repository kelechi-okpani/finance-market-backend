import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import OTP from "@/lib/models/OTP";
import SmsOtp from "@/lib/models/SmsOtp";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const body = await request.json();
        const { email, phone, otp } = body;

        if (!(email || phone) || !otp) {
            return corsResponse({ error: "Email/Phone and OTP are required." }, 400, origin);
        }

        await connectDB();

        // 1. If it's a phone number or looks like one
        const identifier = (phone || email).trim();
        const isPhone = phone || /^\+?[\d\s-]{10,}$/.test(identifier);

        if (isPhone) {
            const cleanedPhone = identifier.replace(/[^\d+]/g, "");
            let normalizedPhone = cleanedPhone;
            if (cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("+")) {
                normalizedPhone = "+234" + cleanedPhone.slice(1);
            } else if (!cleanedPhone.startsWith("+")) {
                normalizedPhone = "+234" + cleanedPhone;
            }

            const smsRecord = await SmsOtp.findOne({ 
                phone: normalizedPhone,
                otp: String(otp).trim()
            });

            if (smsRecord) {
                if (smsRecord.expiresAt < new Date()) {
                    await SmsOtp.deleteOne({ _id: smsRecord._id });
                    return corsResponse({ error: "Invalid or expired OTP." }, 400, origin);
                }

                await SmsOtp.deleteOne({ _id: smsRecord._id });
                return corsResponse({ message: "Phone number verified successfully.", verified: true }, 200, origin);
            }
        }

        // 2. Fallback to Email OTP
        const otpRecord = await OTP.findOne({
            email: identifier.toLowerCase(),
            otp,
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            return corsResponse({ error: "Invalid or expired OTP." }, 400, origin);
        }

        // Delete OTP after verification
        await OTP.deleteOne({ _id: otpRecord._id });

        return corsResponse(
            { message: "Verification successful.", verified: true },
            200,
            origin
        );
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
