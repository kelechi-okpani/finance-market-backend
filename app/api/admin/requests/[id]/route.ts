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
        const { action } = body; // Action: 'approve' | 'reject'

        if (!action || !["approve", "reject"].includes(action)) {
            return corsResponse({ error: "Action must be 'approve' or 'reject'." }, 400, origin);
        }

        await connectDB();

        const accountRequest = await AccountRequest.findById(id);
        if (!accountRequest) {
            return corsResponse({ error: "Account request not found." }, 404, origin);
        }

        if (accountRequest.status === action) {
            return corsResponse({ error: `Request is already ${action}.` }, 400, origin);
        }

        if (action === "approve") {
            // 1. Generate KYC Token first
            const kycToken = Math.floor(1000000 + Math.random() * 9000000).toString();

            // 2. Find or Create User with specific FinTech defaults
            const user = await User.findOneAndUpdate(
                { email: accountRequest.email.toLowerCase() },
                {
                    $set: {
                        firstName: accountRequest.firstName,
                        lastName: accountRequest.lastName,
                        country: accountRequest.country,
                        status: "approved",
                        accountStatus: "pending",
                        kycStatus: "not_started", // Explicitly reset for new flow
                        kycToken: kycToken,
                        onboardingStep: 7, // Start them at your defined entry point
                        role: "user"
                    }
                },
                { upsert: true, new: true, runValidators: true }
            );

            // 3. Update the Lead Request
            accountRequest.status = "approved";
            accountRequest.reviewedBy = auth.user!._id;
            await accountRequest.save();

            // 4. Dispatch Email - Let the user set their password via the link
            await sendKYCLinkEmail(user.email, user.firstName, kycToken);

            return corsResponse({
                message: "User account provisioned and KYC link dispatched.",
                user: { id: user._id, email: user.email, kycToken }
            }, 200, origin);

        } else {
            // REJECT LOGIC
            accountRequest.status = "rejected";
            accountRequest.reviewedBy = auth.user!._id;
            await accountRequest.save();

            await User.findOneAndUpdate(
                { email: accountRequest.email },
                { status: "rejected", accountStatus: "rejected" }
            );

            return corsResponse({ message: "Account request rejected." }, 200, origin);
        }

    } catch (error: any) {
        console.error("Approval Error:", error);
        if (error.code === 11000) {
            return corsResponse({ error: "Conflict: This email is already associated with an active account." }, 409, origin);
        }
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// export async function PUT(
//     request: NextRequest,
//     { params }: { params: Promise<{ id: string }> }
// ) {
//     const origin = request.headers.get("origin");

//     const auth = await requireAdmin(request);
//     if (auth.error) return auth.error;

//     try {
//         const { id } = await params;
//         const body = await request.json();
//         const { action, password } = body; // action: 'approve' | 'reject'

//         if (!action || !["approve", "reject"].includes(action)) {
//             return corsResponse(
//                 { error: "Action must be 'approve' or 'reject'." },
//                 400,
//                 origin
//             );
//         }

//         await connectDB();

//         const accountRequest = await AccountRequest.findById(id);
//         if (!accountRequest) {
//             return corsResponse(
//                 { error: "Account request not found." },
//                 404,
//                 origin
//             );
//         }

//         // Allow toggling between approved and rejected states
//         if (accountRequest.status === action) {
//             return corsResponse(
//                 { error: `This request is already ${action}.` },
//                 400,
//                 origin
//             );
//         }

//         if (action === "approve") {
//             // Password is now optional because users set it during KYC
//             const passwordHash = password ? await hashPassword(password) : undefined;

//             let user = await User.findOne({ email: accountRequest.email });

//             if (!user) {
//                 // Create user account if not exists
//                 user = await User.create({
//                     firstName: accountRequest.firstName,
//                     lastName: accountRequest.lastName,
//                     email: accountRequest.email,
//                     country: accountRequest.country,
//                     passwordHash,
//                     role: "user",
//                     status: "approved",
//                     accountStatus: "pending", // Initially pending review
//                 });
//             } else {
//                 // Update existing user status
//                 user.status = "approved";
//                 user.accountStatus = "pending";
//                 if (!user.country && accountRequest.country) {
//                     user.country = accountRequest.country;
//                 }
//                 await user.save();
//             }

//             // Update request status
//             accountRequest.status = "approved";
//             accountRequest.reviewedBy = auth.user!._id;
//             await accountRequest.save();

//             // Generate a 7-digit KYC token
//             const kycToken = Math.floor(1000000 + Math.random() * 9000000).toString();
//             user.kycToken = kycToken;
//             await user.save();

//             // Send KYC link email (simulated or real)
//             await sendKYCLinkEmail(user.email, user.firstName, kycToken);

//             return corsResponse(
//                 {
//                     message: "Account request approved. User account active and KYC link sent.",
//                     notification: "KYC onboarding link has been sent to the user.",
//                     user: {
//                         id: user._id,
//                         email: user.email,
//                         firstName: user.firstName,
//                         lastName: user.lastName,
//                         status: user.status,
//                     },
//                 },
//                 200,
//                 origin
//             );
//         } else {
//             // Reject - update request AND user if exists
//             accountRequest.status = "rejected";
//             accountRequest.reviewedBy = auth.user!._id;
//             await accountRequest.save();

//             // Also update user status to rejected if they exist
//             await User.findOneAndUpdate(
//                 { email: accountRequest.email },
//                 { status: "rejected", accountStatus: "rejected" }
//             );

//             return corsResponse(
//                 { message: "Account request and associated user account (if any) rejected." },
//                 200,
//                 origin
//             );
//         }
//     } catch (error: unknown) {
//         console.error("Admin review request error:", error);

//         if (
//             error &&
//             typeof error === "object" &&
//             "code" in error &&
//             (error as { code: number }).code === 11000
//         ) {
//             return corsResponse(
//                 { error: "A user with this email already exists." },
//                 409,
//                 origin
//             );
//         }

//         return corsResponse({ error: "Internal server error." }, 500, origin);
//     }
// }
