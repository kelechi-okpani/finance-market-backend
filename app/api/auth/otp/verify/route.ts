import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import OTP from "@/lib/models/OTP";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return corsResponse({ error: "Email and OTP are required." }, 400, origin);
        }

        await connectDB();

        // Check OTP
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp,
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            return corsResponse({ error: "Invalid or expired OTP." }, 400, origin);
        }

        // Delete OTP after verification
        await OTP.deleteOne({ _id: otpRecord._id });

        return corsResponse(
            { message: "Email verified successfully.", verified: true },
            200,
            origin
        );
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
