import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountRequest from "@/lib/models/AccountRequest";
import User from "@/lib/models/User";
import { sendAccountAcknowledgmentEmail } from "@/lib/mail";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/auth/register - Request an account
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const body = await request.json();
        const { firstName, lastName, email, phone, country, message } = body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return corsResponse(
                { error: "First name, last name, and email are required." },
                400,
                origin
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return corsResponse(
                { error: "Please provide a valid email address." },
                400,
                origin
            );
        }

        await connectDB();

        // Check if account request already exists
        const existingRequest = await AccountRequest.findOne({
            email: email.toLowerCase(),
        });
        if (existingRequest) {
            return corsResponse(
                {
                    error: "An account request with this email already exists.",
                    status: existingRequest.status,
                },
                409,
                origin
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return corsResponse(
                { error: "An account with this email already exists. Please sign in." },
                409,
                origin
            );
        }

        // Create account request
        const accountRequest = await AccountRequest.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim(),
            country: country?.trim(),
            message: message?.trim(),
        });

        // Send acknowledgment email instead of invitation link
        await sendAccountAcknowledgmentEmail(accountRequest.email, accountRequest.firstName);

        return corsResponse(
            {
                message:
                    "Account request submitted successfully. You will receive an email once approved.",
                request: {
                    id: accountRequest._id,
                    firstName: accountRequest.firstName,
                    lastName: accountRequest.lastName,
                    email: accountRequest.email,
                    status: accountRequest.status,
                    createdAt: accountRequest.createdAt,
                },
            },
            201,
            origin
        );
    } catch (error: unknown) {
        console.error("Register error:", error);

        // Handle MongoDB duplicate key error
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code: number }).code === 11000
        ) {
            return corsResponse(
                { error: "An account request with this email already exists." },
                409,
                origin
            );
        }

        return corsResponse(
            { error: "Internal server error. Please try again later." },
            500,
            origin
        );
    }
}
