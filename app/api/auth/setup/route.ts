import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/auth/setup - Create the initial admin user (one-time setup)
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        await connectDB();

        const body = await request.json();
        const { firstName, lastName, email, password, role = "user" } = body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return corsResponse(
                { error: "First name, last name, email, and password are required." },
                400,
                origin
            );
        }

        if (password.length < 8) {
            return corsResponse(
                { error: "Password must be at least 8 characters long." },
                400,
                origin
            );
        }

        // Validate role
        if (!["admin", "user"].includes(role)) {
            return corsResponse(
                { error: "Role must be 'admin' or 'user'." },
                400,
                origin
            );
        }

        // Generate Investor Code (FS + 9 digits)
        const investorCode = `FS${Math.floor(100000000 + Math.random() * 900000000).toString()}`;

        // Create user
        const passwordHash = await hashPassword(password);
        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role,
            status: "approved", // instantly approve
            accountCategory: "Retail Investor",
            investorCode,
            kycVerified: true,
            agreementSigned: true,
            onboardingStep: 15, // Mark onboarding as complete
        });

        return corsResponse(
            {
                message: `${role === "admin" ? "Admin" : "User"} account created successfully.`,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    investorCode: user.investorCode,
                },
            },
            201,
            origin
        );
    } catch (error: unknown) {
        console.error("Setup error:", error);

        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code: number }).code === 11000
        ) {
            return corsResponse(
                { error: "An account with this email already exists." },
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
