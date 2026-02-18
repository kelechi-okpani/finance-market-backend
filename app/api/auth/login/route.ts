import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { verifyPassword, generateToken } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/auth/login - Sign in
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate required fields
        if (!email || !password) {
            return corsResponse(
                { error: "Email and password are required." },
                400,
                origin
            );
        }

        await connectDB();

        // Find user by email (include passwordHash for verification)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return corsResponse(
                { error: "Invalid email or password." },
                401,
                origin
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return corsResponse(
                { error: "Invalid email or password." },
                401,
                origin
            );
        }

        // Check account status
        if (user.status === "pending") {
            return corsResponse(
                {
                    error:
                        "Your account is pending approval. Please wait for admin approval.",
                },
                403,
                origin
            );
        }

        if (user.status === "rejected") {
            return corsResponse(
                { error: "Your account has been rejected. Please contact support." },
                403,
                origin
            );
        }

        // Generate JWT token
        const token = generateToken(user);

        return corsResponse(
            {
                message: "Login successful.",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                    kycVerified: user.kycVerified,
                    agreementSigned: user.agreementSigned,
                },
            },
            200,
            origin
        );
    } catch (error) {
        console.error("Login error:", error);
        return corsResponse(
            { error: "Internal server error. Please try again later." },
            500,
            origin
        );
    }
}
