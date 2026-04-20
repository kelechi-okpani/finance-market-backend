import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CashMovement from "@/lib/models/CashMovement";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const [transactions, total] = await Promise.all([
            CashMovement.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "firstName lastName email")
                .lean(),
            CashMovement.countDocuments(filter)
        ]);

        return corsResponse({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, origin);

    } catch (err: any) {
        console.error("Admin GET Transactions Error:", err);
        return corsResponse({ error: "Failed to fetch transactions" }, 500, origin);
    }
}