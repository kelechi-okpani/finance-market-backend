import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/market/stocks/[id]
 * Fetch a single stock by ID.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const origin = request.headers.get("origin");
    const { id } = params;

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();
        const stock = await Stock.findById(id);

        if (!stock) {
            return corsResponse({ error: "Stock not found." }, 404, origin);
        }

        return corsResponse({ stock }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch stock", details: err.message }, 500, origin);
    }
}

/**
 * PUT /api/admin/market/stocks/[id]
 * Update a stock by ID.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const origin = request.headers.get("origin");
    const { id } = params;

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        await connectDB();

        const stock = await Stock.findByIdAndUpdate(
            id,
            { $set: { ...body, lastUpdated: new Date() } },
            { new: true }
        );

        if (!stock) {
            return corsResponse({ error: "Stock not found." }, 404, origin);
        }

        return corsResponse({ message: "Stock updated successfully.", stock }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to update stock", details: err.message }, 500, origin);
    }
}

/**
 * DELETE /api/admin/market/stocks/[id]
 * Delete a stock by ID.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const origin = request.headers.get("origin");
    const { id } = params;

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();
        const stock = await Stock.findByIdAndDelete(id);

        if (!stock) {
            return corsResponse({ error: "Stock not found." }, 404, origin);
        }

        return corsResponse({ message: "Stock deleted successfully." }, 200, origin);
    } catch (err: any) {
        return corsResponse({ error: "Failed to delete stock", details: err.message }, 500, origin);
    }
}
