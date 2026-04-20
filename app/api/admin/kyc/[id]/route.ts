import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PUT /api/admin/kyc/[id]
 * Unified endpoint to update user kyc settings, approve/reject.
 */

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const origin = request.headers.get("origin");
    const { id: userId } = await params;

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const user = await User.findById(userId);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Define the "Golden State" for an approved user
        const update: any = {
            kycStatus: "verified",
            kycVerified: true,
            status: "approved",
            accountStatus: "active",
            // If they don't have a category yet, default to their account type (Individual/Corporate)
            accountCategory: user.accountCategory || user.accountType || "standard"
        };

        // Generate the 11-char Investor Code (FS + 9 digits) if missing
        if (!user.investorCode) {
            const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
            update.investorCode = `FS${randomSuffix}`;
        }

        // Execute all updates in parallel
        const [updatedUser] = await Promise.all([
            User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true }).lean(),
            KYCDocument.updateMany({ userId, status: "pending" }, { status: "approved" }),
            AddressVerification.updateMany({ userId, status: "pending" }, { status: "approved" })
        ]);

        return corsResponse({ 
            message: `User ${updatedUser?.firstName} successfully activated.`, 
            investorCode: updatedUser?.investorCode,
            user: updatedUser 
        }, 200, origin);

    } catch (err: any) {
        console.error("One-click approval error:", err);
        return corsResponse({ error: "Approval failed." }, 500, origin);
    }
}


// export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//     const origin = request.headers.get("origin");
//     const { id: userId } = await params;

//     try {
//         const auth = await requireAdmin(request);
//         if (auth.error) return auth.error;

//         const body = await request.json();
//         const { kycStatus, kycVerified, accountStatus, reason } = body;

//         await connectDB();

//         const user = await User.findById(userId);
//         if (!user) {
//             return corsResponse({ error: "User not found." }, 404, origin);
//         }

//         const update: any = {};
//         if (kycStatus) update.kycStatus = kycStatus;
//         if (typeof kycVerified === "boolean") update.kycVerified = kycVerified;
//         if (accountStatus) update.accountStatus = accountStatus;

//         const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

//         // If approving, also update documents if they are pending
//         if (kycStatus === "verified" || kycVerified === true) {
//             await KYCDocument.updateMany({ userId, status: "pending" }, { status: "approved" });
//             await AddressVerification.updateMany({ userId, status: "pending" }, { status: "approved" });
//         }

//         // If rejecting, we could update logs or send notification
//         if (kycStatus === "rejected" && reason) {
//             await KYCDocument.updateMany({ userId, status: "pending" }, { status: "rejected", rejectionReason: reason });
//         }


//         return corsResponse({ message: "KYC status updated.", user: updatedUser }, 200, origin);

//     } catch (err: any) {
//         return corsResponse({ error: "Failed to update KYC", details: err.message }, 500, origin);
//     }
// }
