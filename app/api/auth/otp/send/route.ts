import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import OTP from "@/lib/models/OTP";
import { sendOTPEmail } from "@/lib/mail";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return corsResponse({ error: "Email is required." }, 400, origin);
        }

        await connectDB();

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to DB (upsert for same email)
        await OTP.findOneAndUpdate(
            { email: email.toLowerCase() },
            { otp: otpCode, expiresAt },
            { upsert: true, new: true }
        );

        // Send Email
        const mailResult = await sendOTPEmail(email, otpCode);

        if (!mailResult.success) {
            return corsResponse({ 
                error: "Failed to send OTP email.",
                details: (mailResult.error as any)?.message || "Check SMTP configuration on Vercel.",
                simulatedOTP: otpCode // For debugging, allows continuing without working email
            }, 500, origin);
        }

        const isSimulated = mailResult.message === "Simulation successful.";
        
        return corsResponse(
            { 
                message: "OTP sent successfully to " + email,
                ...(isSimulated && { dev_simulated_otp: otpCode })
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Send OTP Error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
