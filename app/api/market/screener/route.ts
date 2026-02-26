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

// GET /api/market/screener
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        await connectDB();

        const [
            totalStocks, totalBonds, totalETFs, totalMutualFunds, totalCommodities,
            gainers, losers, sectors, topGainers, topLosers
        ] = await Promise.all([
            Stock.countDocuments(),
            Bond.countDocuments(),
            ETF.countDocuments(),
            MutualFund.countDocuments(),
            Commodity.countDocuments(),
            Stock.countDocuments({ change: { $gt: 0 } }),
            Stock.countDocuments({ change: { $lt: 0 } }),
            Stock.distinct("sector"),
            Stock.find({ change: { $gt: 0 } }).sort({ changePercent: -1 }).limit(5).select("symbol name price changePercent").lean(),
            Stock.find({ change: { $lt: 0 } }).sort({ changePercent: 1 }).limit(5).select("symbol name price changePercent").lean(),
        ]);

        return corsResponse({
            totalStocks, totalBonds, totalETFs,
            mutualFunds: totalMutualFunds,
            commodities: totalCommodities,
            sectors: sectors.length,
            gainers, losers,
            topGainers, topLosers,
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch screener data", details: err.message }, 500, origin);
    }
}
