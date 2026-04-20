import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PaymentMethod from "@/lib/models/PaymentMethod";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/funds/payment-methods - List user's payment methods
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const methods = await PaymentMethod.find({ userId: auth.user!._id });
        return corsResponse({ methods }, 200, origin);
    } catch (error) {
        console.error("Payment methods list API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/funds/payment-methods - Add new payment method
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { type, label, details, isDefault } = body;

        if (!type || !label) {
            return corsResponse({ error: "Type and label are required." }, 400, origin);
        }

        await connectDB();

        // If setting as default, unset others first
        if (isDefault) {
            await PaymentMethod.updateMany({ userId: auth.user!._id }, { $set: { isDefault: false } });
        }

        const method = await PaymentMethod.create({
            userId: auth.user!._id,
            type,
            label,
            details,
            isDefault: !!isDefault
        });

        return corsResponse({ message: "Payment method added.", method }, 201, origin);
    } catch (error) {
        console.error("Payment method create API error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
