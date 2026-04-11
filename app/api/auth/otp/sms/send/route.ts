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
 * POST /api/auth/otp/sms/send
 * Simulates sending an SMS OTP by saving it to the user profile or account request.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let email: string | undefined;
        let phone: string | undefined;

        // 1. Try to get from JSON body
        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                email = body.email;
                phone = body.phone;
            }
        } catch (e) {
            // Ignore parse errors if we can get from query params
        }

        // 2. Try to get from Query Parameters if not in body
        if (!email && !phone) {
            const { searchParams } = new URL(request.url);
            email = searchParams.get("email") || undefined;
            phone = searchParams.get("phone") || undefined;
        }

        if (!email && !phone) {
            return corsResponse({ 
                error: "Identification required.", 
                details: "Please provide email or phone in JSON body or as a query parameter." 
            }, 400, origin);
        }

        await connectDB();

        // Build query with phone normalization logic
        let query: any;
        if (email) {
            query = { email: email.toLowerCase().trim() };
        } else if (phone) {
            const trimmedPhone = phone.trim();
            // Create an OR query to match multiple formats
            const phoneVariants = [trimmedPhone];
            
            // If it starts with 0, add the +234 variant
            if (trimmedPhone.startsWith("0")) {
                phoneVariants.push("+234" + trimmedPhone.slice(1));
            }
            // If it starts with +234, add the 0 variant
            if (trimmedPhone.startsWith("+234")) {
                phoneVariants.push("0" + trimmedPhone.slice(4));
            }

            query = { phone: { $in: phoneVariants } };
        }
        
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
                details: `No record matches ${email || phone}. If using a phone number, ensure it matches the database format (e.g., +234...)` 
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
                foundVia: email || phone,
                matchedRecord: user ? "User" : "AccountRequest"
            },
            200,
            origin
        );

    } catch (error: any) {
        console.error("SMS OTP Send Error:", error);
        return corsResponse({ error: "Failed to generate SMS OTP.", details: error.message }, 500, origin);
    }
}
