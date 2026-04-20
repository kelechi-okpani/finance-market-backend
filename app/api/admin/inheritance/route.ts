import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
// IMPORTANT: Force model registration for population
import "@/lib/models/User";
import "@/lib/models/Portfolio";
import PortfolioInheritance from "@/lib/models/PortfolioInheritance";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/inheritance
 * List all inheritance requests for admin review.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    
    // 1. Verify Admin Permissions
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // 2. Fetch with explicit model references and lean() for performance
        const requests = await PortfolioInheritance.find({})
            .populate({
                path: "originalOwnerId",
                select: "firstName lastName email",
                model: "User"
            })
            .populate({
                path: "beneficiaryId",
                select: "firstName lastName email",
                model: "User"
            })
            .populate({
                path: "portfolioId",
                select: "name",
                model: "Portfolio"
            })
            .sort({ createdAt: -1 })
            .lean();

        // 3. Format data for the Frontend (Optional but helpful)
        const formattedRequests = requests.map((req: any) => ({
            ...req,
            ownerName: req.originalOwnerId ? `${req.originalOwnerId.firstName} ${req.originalOwnerId.lastName}` : "System/Legacy",
            beneficiaryName: req.beneficiaryId ? `${req.beneficiaryId.firstName} ${req.beneficiaryId.lastName}` : "Unassigned",
            portfolioName: req.portfolioId?.name || "Deleted Portfolio",
        }));

        return corsResponse({ requests: formattedRequests }, 200, origin);
    } catch (error: any) {
        console.error("Inheritance Fetch Error:", error);
        return corsResponse(
            { error: error.message || "Failed to fetch inheritance requests." }, 
            500, 
            origin
        );
    }
}