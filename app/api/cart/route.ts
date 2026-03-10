import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CartItem from "@/lib/models/CartItem";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/cart - List user's cart items
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const items = await CartItem.find({ userId: auth.user!._id }).sort({ createdAt: -1 });
        return corsResponse({ items }, 200, origin);
    } catch (error) {
        console.error("Cart GET error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { type, symbol, companyName, shares, pricePerShare, portfolioId, holdingId } = body;

        if (!type || !symbol || !shares || !pricePerShare) {
            return corsResponse({ error: "Required fields: type, symbol, shares, pricePerShare" }, 400, origin);
        }

        await connectDB();

        const totalAmount = shares * pricePerShare;

        const cartItem = await CartItem.create({
            userId: auth.user!._id,
            type,
            symbol: symbol.toUpperCase(),
            companyName: companyName || symbol,
            shares,
            pricePerShare,
            totalAmount,
            portfolioId,
            holdingId,
        });

        return corsResponse({ message: "Item added to cart", cartItem }, 201, origin);
    } catch (error) {
        console.error("Cart POST error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        await CartItem.deleteMany({ userId: auth.user!._id });
        return corsResponse({ message: "Cart cleared" }, 200, origin);
    } catch (error) {
        console.error("Cart DELETE error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
