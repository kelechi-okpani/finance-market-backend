import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { verifyPassword, generateToken } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// General login logic used by both GET and POST
async function handleLogin(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        let email: string | null = null;
        let password: string | null = null;

        // Try to get credentials from JSON body (POST)
        try {
            const body = await request.json();
            if (body) {
                email = body.email;
                password = body.password;
            }
        } catch {
            // Fallback to query parameters (useful for browser/GET tests)
            const { searchParams } = new URL(request.url);
            email = searchParams.get("email");
            password = searchParams.get("password");
        }

        // Validate required fields
        if (!email || !password) {
            return corsResponse(
                { error: "Email and password are required. Ensure you are sending a JSON body OR query parameters." },
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
                    sex: user.sex,
                    investorCode: user.investorCode,
                    accountCategory: user.accountCategory,
                    accountType: user.accountType || "individual",
                    kycStatus: user.kycVerified ? "verified" : (user.kycStatus || "not_started"),
                    kycVerified: user.kycVerified,
                    riskTolerance: user.riskTolerance || "moderate",
                    baseCurrency: user.baseCurrency || "USD",
                    agreementSigned: user.agreementSigned,
                    createdAt: user.createdAt,
                    onboardingStep: user.onboardingStep,
                    country: user.country || "",
                    avatar: user.headshotUrl || user.avatar || "",
                    isApproved: user.status === "approved" || user.status === "onboarding",
                    isKyc: user.kycVerified || user.onboardingStep >= 16,
                    accountStatus: user.accountStatus || "pending",
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

export async function POST(request: NextRequest) {
    return handleLogin(request);
}

export async function GET(request: NextRequest) {
    return handleLogin(request);
}
