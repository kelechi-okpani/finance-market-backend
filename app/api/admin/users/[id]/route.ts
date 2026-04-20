import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Portfolio from "@/lib/models/Portfolio";
import CashMovement from "@/lib/models/CashMovement";
import TradeRequest from "@/lib/models/TradeRequest";
import KYCDocument from "@/lib/models/KYCDocument";
import AddressVerification from "@/lib/models/AddressVerification";
import ChatMessage from "@/lib/models/ChatMessage";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// 1. Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// 2. GET: Fetch comprehensive user details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        const user = await User.findById(id).select("-passwordHash").lean();
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        const [
            portfolios,
            cashMovements,
            tradeRequests,
            kycDocuments,
            addressVerifications,
            chatCount,
            portfolioTransfers
        ] = await Promise.all([
            Portfolio.find({ userId: id }).lean(),
            CashMovement.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
            TradeRequest.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
            KYCDocument.find({ userId: id }).sort({ createdAt: -1 }).lean(),
            AddressVerification.find({ userId: id }).sort({ createdAt: -1 }).lean(),
            ChatMessage.countDocuments({ userId: id }),
            PortfolioTransfer.find({ 
                $or: [{ senderId: id }, { recipientId: id }] 
            }).sort({ createdAt: -1 }).lean(),
        ]);

        let totalInvestedValue = 0;
        const allAssets = portfolios.flatMap((p: any) => {
            return (p.assets || []).map((asset: any) => {
                const cost = (asset.shares || 0) * (asset.averagePrice || 0);
                totalInvestedValue += cost;
                return { ...asset, portfolioName: p.name, portfolioId: p._id };
            });
        });

        return corsResponse({
            user,
            summary: {
                totalBalance: user.totalBalance || 0,
                availableCash: user.availableCash || 0,
                totalInvested: totalInvestedValue,
                portfolioCount: portfolios.length,
                tradeRequestCount: tradeRequests.length,
                totalChats: chatCount,
                riskProfile: user.riskTolerance || "Not Set",
                onboardingStep: user.onboardingStep
            },
            verification: {
                kyc: kycDocuments,
                address: addressVerifications,
                isVerified: user.kycVerified || false
            },
            activity: {
                cash: cashMovements,
                trades: tradeRequests,
                transfers: portfolioTransfers,
            },
            assets: {
                portfolios: portfolios.map((p: any) => ({
                    ...p,
                    id: p._id.toString(),
                    assetCount: (p.assets || []).length
                })),
                flattenedHoldings: allAssets,
            }
        }, 200, origin);

    } catch (error: any) {
        console.error("Admin GET user error:", error);
        return corsResponse({ error: "Internal server error", details: error.message }, 500, origin);
    }
}

// 3. PUT: Full User Update
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
        await connectDB();

        const user = await User.findById(id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        // Prevent modifying own admin status
        if (user._id.toString() === auth.user!._id.toString() && body.role && body.role !== "admin") {
            return corsResponse({ error: "You cannot remove your own admin role." }, 400, origin);
        }

        // Mass assignment of allowed fields
 // 1. Define a strict list of allowed keys to prevent injection of unwanted fields
            const allowedFields = [
            "status", "role", "kycVerified", "agreementSigned", 
            "country", "firstName", "lastName", "phone", 
            "baseCurrency", "availableCash", "totalBalance"
            ] as const;

// 2. Iterate through the body keys
            Object.keys(body).forEach((key) => {
            // Only process if the key is in our allowed list and not undefined
            if (allowedFields.includes(key as any) && body[key] !== undefined) {
                
                // Handle special logic for KYC
                if (key === "kycVerified") {
                user.kycVerified = body.kycVerified;
                user.kycStatus = body.kycVerified ? "verified" : "not_started";
                } else {
                // Use (user as any) only for the dynamic assignment to satisfy TS 
                // while keeping the rest of the logic clean
                (user as any)[key] = body[key];
                }
            }
            });
        // Trigger Portfolio creation if approved
        if (body.status === "approved") {
            const existingMain = await Portfolio.findOne({ userId: user._id, name: "Main Portfolio" });
            if (!existingMain) {
                await Portfolio.create({ userId: user._id, name: "Main Portfolio", status: "active", source: "created" });
            }
        }

        await user.save();
        return corsResponse({ message: "User updated successfully.", user }, 200, origin);
    } catch (error: any) {
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}

// 4. PATCH: Partial Updates (Suspension, etc.)
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
        await connectDB();

        const user = await User.findById(id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        if (body.accountStatus) user.accountStatus = body.accountStatus;
        if (body.status) user.status = body.status;
        // ... add other specific fields as needed

        await user.save();
        return corsResponse({ message: "Status updated.", user }, 200, origin);
    } catch (error: any) {
        return corsResponse({ error: "Update failed.", details: error.message }, 500, origin);
    }
}

// 5. DELETE: Remove User
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        if (id === auth.user!._id.toString()) {
            return corsResponse({ error: "You cannot delete your own account." }, 400, origin);
        }

        await connectDB();
        const user = await User.findByIdAndDelete(id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        return corsResponse({ message: "User deleted successfully." }, 200, origin);
    } catch (error: any) {
        return corsResponse({ error: "Delete failed." }, 500, origin);
    }
}