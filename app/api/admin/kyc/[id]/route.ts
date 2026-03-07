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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const origin = request.headers.get("origin");
    const { id: userId } = params;

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { kycStatus, kycVerified, accountStatus, reason } = body;

        await connectDB();

        const user = await User.findById(userId);
        if (!user) {
            return corsResponse({ error: "User not found." }, 404, origin);
        }

        const update: any = {};
        if (kycStatus) update.kycStatus = kycStatus;
        if (typeof kycVerified === "boolean") update.kycVerified = kycVerified;
        if (accountStatus) update.accountStatus = accountStatus;

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

        // If approving, also update documents if they are pending
        if (kycStatus === "verified" || kycVerified === true) {
            await KYCDocument.updateMany({ userId, status: "pending" }, { status: "approved" });
            await AddressVerification.updateMany({ userId, status: "pending" }, { status: "approved" });
        }

        // If rejecting, we could update logs or send notification
        if (kycStatus === "rejected" && reason) {
            await KYCDocument.updateMany({ userId, status: "pending" }, { status: "rejected", rejectionReason: reason });
        }

        return corsResponse({ message: "KYC status updated.", user: updatedUser }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update KYC", details: err.message }, 500, origin);
    }
}
