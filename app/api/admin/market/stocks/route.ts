import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/market/stocks
 * Admin tool to manage market stocks.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const sector = searchParams.get("sector");
        const market = searchParams.get("market");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (sector) filter.sector = sector;
        if (market) filter.market = market;

        const [stocks, total] = await Promise.all([
            Stock.find(filter).sort({ symbol: 1 }).skip(skip).limit(limit).lean(),
            Stock.countDocuments(filter)
        ]);

        return corsResponse({
            stocks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch stocks", details: err.message }, 500, origin);
    }
}

/**
 * POST /api/admin/market/stocks
 * Admin tool to create or update a stock.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { symbol, name, price, sector, market, isPublished } = body;

        if (!symbol || !name || !price) {
            return corsResponse({ error: "Symbol, name, and price are required." }, 400, origin);
        }

        await connectDB();

        const update: any = {
            name,
            price,
            sector,
            market,
            lastUpdated: new Date()
        };

        if (typeof isPublished === "boolean") {
            update.isPublished = isPublished;
        }

        const stock = await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { $set: update },
            { upsert: true, new: true }
        );

        return corsResponse({ message: "Stock updated successfully.", stock }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update stock", details: err.message }, 500, origin);
    }
}
