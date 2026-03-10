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
            const oldStatus = user.status;
            user.status = status;

            // If newly approved, create Main Portfolio
            if (status === "approved" && oldStatus !== "approved") {
                const Portfolio = (await import("@/lib/models/Portfolio")).default;
                const existingMain = await Portfolio.findOne({ userId: user._id, name: "Main Portfolio" });
                if (!existingMain) {
                    await Portfolio.create({
                        userId: user._id,
                        name: "Main Portfolio",
                        type: "stocks",
                        status: "active",
                        source: "created"
                    });
                }
            }
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

/**
 * PATCH /api/admin/users/[id]
 * Partial update for admin actions like suspension.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { accountStatus, status } = body;

        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        // Apply partial updates
        if (accountStatus && ["active", "suspended", "pending", "rejected"].includes(accountStatus)) {
            user.accountStatus = accountStatus;
        }

        if (status && ["pending", "approved", "rejected", "onboarding"].includes(status)) {
            const oldStatus = user.status;
            user.status = status;

            // If newly approved, create Main Portfolio
            if (status === "approved" && oldStatus !== "approved") {
                const Portfolio = (await import("@/lib/models/Portfolio")).default;
                const existingMain = await Portfolio.findOne({ userId: user._id, name: "Main Portfolio" });
                if (!existingMain) {
                    await Portfolio.create({
                        userId: user._id,
                        name: "Main Portfolio",
                        type: "stocks",
                        status: "active",
                        source: "created"
                    });
                }
            }
        }

        await user.save();

        return corsResponse(
            { message: `User account status updated to ${user.accountStatus}.`, user },
            200,
            origin
        );
    } catch (error: any) {
        console.error("Admin PATCH user error:", error);
        return corsResponse({ error: "Failed to update user.", details: error.message }, 500, origin);
    }
}
