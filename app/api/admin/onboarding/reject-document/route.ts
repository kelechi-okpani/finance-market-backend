import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/admin/onboarding/reject-document
 * Admin tool to reject a specific KYC or Address document.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const { userId, type, documentId, reason } = await request.json();

        if (!userId || !type || !documentId || !reason) {
            return corsResponse({ error: "Missing required fields: userId, type (kyc|address), documentId, reason." }, 400, origin);
        }

        await connectDB();

        if (type === "kyc") {
            await KYCDocument.findByIdAndUpdate(documentId, {
                status: "rejected",
                rejectionReason: reason,
                reviewedBy: auth.user!._id,
                reviewedAt: new Date()
            });
        } else if (type === "address") {
            await AddressVerification.findByIdAndUpdate(documentId, {
                status: "rejected",
                rejectionReason: reason,
                reviewedBy: auth.user!._id,
                reviewedAt: new Date()
            });
        }

        // Set user status to onboarding so they can re-upload
        await User.findByIdAndUpdate(userId, { status: "onboarding" });

        return corsResponse({ message: "Document rejected. User has been notified to re-upload." }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Rejection failed", details: err.message }, 500, origin);
    }
}
