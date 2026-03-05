import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AccountRequest from "@/lib/models/AccountRequest";
import User from "@/lib/models/User";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { sendKYCLinkEmail } from "@/lib/mail";

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
            // Password is now optional because users set it during KYC
            const passwordHash = password ? await hashPassword(password) : undefined;

            // Create user account
            const user = await User.create({
                firstName: accountRequest.firstName,
                lastName: accountRequest.lastName,
                email: accountRequest.email,
                passwordHash,
                role: "user",
                status: "approved",
                accountStatus: "pending", // Initially pending review
            });

            // Update request status
            accountRequest.status = "approved";
            accountRequest.reviewedBy = auth.user!._id;
            await accountRequest.save();

            // Send KYC link email (simulated)
            await sendKYCLinkEmail(user.email, user.firstName);

            return corsResponse(
                {
                    message: "Account request approved. User account created and KYC link sent.",
                    notification: "KYC onboarding link has been sent to the user.",
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
