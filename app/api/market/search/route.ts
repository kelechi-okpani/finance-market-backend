import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/lib/models/Stock";
import Bond from "@/lib/models/Bond";
import ETF from "@/lib/models/ETF";
import MutualFund from "@/lib/models/MutualFund";
import Commodity from "@/lib/models/Commodity";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/search?q=apple&type=stock
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const type = searchParams.get("type");

    if (!query || query.length < 2) {
        return corsResponse({ error: "Search query must be at least 2 characters." }, 400, origin);
    }

    try {
        await connectDB();

        const textFilter = {
            $or: [
                { name: { $regex: query, $options: "i" } },
                { symbol: { $regex: query, $options: "i" } },
            ]
        };

        const results: any[] = [];

        if (!type || type === "stock") {
            const stocks = await Stock.find(textFilter).limit(10).lean();
            stocks.forEach(s => results.push({ ...s, assetClass: "stock" }));
        }
        if (!type || type === "bond") {
            const bonds = await Bond.find({
                $or: [
                    { issuer: { $regex: query, $options: "i" } },
                    { symbol: { $regex: query, $options: "i" } },
                ]
            }).limit(10).lean();
            bonds.forEach(b => results.push({ ...b, assetClass: "bond" }));
        }
        if (!type || type === "etf") {
            const etfs = await ETF.find(textFilter).limit(10).lean();
            etfs.forEach(e => results.push({ ...e, assetClass: "etf" }));
        }
        if (!type || type === "mutual_fund") {
            const funds = await MutualFund.find(textFilter).limit(10).lean();
            funds.forEach(f => results.push({ ...f, assetClass: "mutual_fund" }));
        }
        if (!type || type === "commodity") {
            const commodities = await Commodity.find(textFilter).limit(10).lean();
            commodities.forEach(c => results.push({ ...c, assetClass: "commodity" }));
        }

        return corsResponse({ results, total: results.length }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Search failed", details: err.message }, 500, origin);
    }
}
