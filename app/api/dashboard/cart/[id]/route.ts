import { NextRequest } from "next/server";
import mongoose from "mongoose";
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

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return corsResponse({ error: "Invalid Item ID." }, 400, origin);
        }

        await connectDB();

        // Security check: only delete if it belongs to the authenticated user
        const deletedItem = await CartItem.findOneAndDelete({ 
            _id: id, 
            userId: auth.user!._id 
        });

        if (!deletedItem) {
            return corsResponse({ error: "Item not found in your cart." }, 404, origin);
        }

        return corsResponse({ message: "Item removed.", symbol: deletedItem.symbol }, 200, origin);
    } catch (error) {
        return corsResponse({ error: "Removal failed." }, 500, origin);
    }
}