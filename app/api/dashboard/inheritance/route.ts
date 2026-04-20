import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioInheritance from "@/lib/models/PortfolioInheritance";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/inheritance/request
 * Allows a beneficiary to claim a portfolio by providing the original owner's email and legal proof.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { originalOwnerEmail, portfolioName, legalDocumentUrl, notes } = await request.json();

        await connectDB();

        // 1. Verify the original owner exists
        const originalOwner = await User.findOne({ email: originalOwnerEmail.toLowerCase().trim() });
        if (!originalOwner) {
            return corsResponse({ error: "No account found associated with that email." }, 404, origin);
        }

        // 2. Create a PENDING inheritance record for Admin review
        // We don't move assets yet; we just log the claim.
        const inheritanceClaim = await PortfolioInheritance.create({
            originalOwnerId: originalOwner._id,
            beneficiaryId: auth.user!._id,
            legalDocumentUrl,
            adminNotes: `Claim for: ${portfolioName}. User Notes: ${notes}`,
            status: 'pending'
        });

        return corsResponse({ 
            message: "Inheritance claim submitted. Our legal team will review the documents.",
            claimId: inheritanceClaim._id 
        }, 201, origin);

    } catch (error: any) {
        console.error("Inheritance Request Error:", error);
        return corsResponse({ error: "Failed to submit inheritance request." }, 500, origin);
    }
}