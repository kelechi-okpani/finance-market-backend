import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CartItem from "@/lib/models/CartItem";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        await connectDB();

        const item = await CartItem.findOneAndDelete({ _id: id, userId: auth.user!._id });
        if (!item) {
            return corsResponse({ error: "Item not found in cart" }, 404, origin);
        }

        return corsResponse({ message: "Item removed from cart" }, 200, origin);
    } catch (error) {
        console.error("Cart item DELETE error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
