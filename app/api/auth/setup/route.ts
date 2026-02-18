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

        // Check if any admin already exists
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            return corsResponse(
                { error: "Admin account already exists. Setup is not allowed." },
                403,
                origin
            );
        }

        const body = await request.json();
        const { firstName, lastName, email, password } = body;

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

        // Create admin user
        const passwordHash = await hashPassword(password);
        const admin = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "admin",
            status: "approved",
            kycVerified: true,
            agreementSigned: true,
        });

        return corsResponse(
            {
                message: "Admin account created successfully.",
                user: {
                    id: admin._id,
                    email: admin.email,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    role: admin.role,
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
