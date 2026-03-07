import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/admin/users/[id] - Update user status or role
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { status, role, kycVerified, agreementSigned } = body;

        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Prevent modifying own admin status
        if (
            user._id.toString() === auth.user!._id.toString() &&
            role &&
            role !== "admin"
        ) {
            return corsResponse(
                { error: "You cannot remove your own admin role." },
                400,
                origin
            );
        }

        // Update allowed fields
        if (status && ["pending", "approved", "rejected", "onboarding"].includes(status)) {
            user.status = status;
        }
        if (role && ["user", "admin"].includes(role)) {
            user.role = role;
        }
        if (typeof kycVerified === "boolean") {
            user.kycVerified = kycVerified;
        }
        if (typeof agreementSigned === "boolean") {
            user.agreementSigned = agreementSigned;
        }

        await user.save();

        return corsResponse(
            {
                message: "User updated successfully.",
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
        console.error("Admin update user error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;

        await connectDB();

        // Prevent self-deletion
        if (id === auth.user!._id.toString()) {
            return corsResponse(
                { error: "You cannot delete your own account." },
                400,
                origin
            );
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        return corsResponse(
            { message: "User deleted successfully." },
            200,
            origin
        );
    } catch (error) {
        console.error("Admin delete user error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
