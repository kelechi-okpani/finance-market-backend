import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountRequest from "@/lib/models/AccountRequest";
import User from "@/lib/models/User";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// PUT /api/admin/requests/[id] - Approve or reject an account request
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
        const { action, password } = body; // action: 'approve' | 'reject'

        if (!action || !["approve", "reject"].includes(action)) {
            return corsResponse(
                { error: "Action must be 'approve' or 'reject'." },
                400,
                origin
            );
        }

        await connectDB();

        const accountRequest = await AccountRequest.findById(id);
        if (!accountRequest) {
            return corsResponse(
                { error: "Account request not found." },
                404,
                origin
            );
        }

        if (accountRequest.status !== "pending") {
            return corsResponse(
                { error: `This request has already been ${accountRequest.status}.` },
                400,
                origin
            );
        }

        if (action === "approve") {
            // Password is required when approving (admin sets it for the user)
            if (!password || password.length < 8) {
                return corsResponse(
                    {
                        error:
                            "A password (min 8 characters) is required when approving a user.",
                    },
                    400,
                    origin
                );
            }

            // Create user account
            const passwordHash = await hashPassword(password);
            const user = await User.create({
                firstName: accountRequest.firstName,
                lastName: accountRequest.lastName,
                email: accountRequest.email,
                passwordHash,
                role: "user",
                status: "approved",
            });

            // Update request status
            accountRequest.status = "approved";
            accountRequest.reviewedBy = auth.user!._id;
            await accountRequest.save();

            return corsResponse(
                {
                    message: "Account request approved. User account created.",
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        status: user.status,
                    },
                },
                200,
                origin
            );
        } else {
            // Reject
            accountRequest.status = "rejected";
            accountRequest.reviewedBy = auth.user!._id;
            await accountRequest.save();

            return corsResponse(
                { message: "Account request rejected." },
                200,
                origin
            );
        }
    } catch (error: unknown) {
        console.error("Admin review request error:", error);

        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code: number }).code === 11000
        ) {
            return corsResponse(
                { error: "A user with this email already exists." },
                409,
                origin
            );
        }

        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
