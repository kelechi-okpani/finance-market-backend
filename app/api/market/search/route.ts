import { NextRequest } from "next/server";
import { mockStocks, mockBonds, mockETFs, mockMutualFunds, mockCommodities } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/search?q=apple&type=stock
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // optional: stock, bond, etf, mutual_fund, commodity

    if (!query || query.length < 2) {
        return corsResponse({ error: "Search query must be at least 2 characters." }, 400, origin);
    }

    const q = query.toLowerCase();
    const results: any[] = [];

    if (!type || type === "stock") {
        mockStocks.filter(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q))
            .forEach(s => results.push({ ...s, assetClass: "stock" }));
    }
    if (!type || type === "bond") {
        mockBonds.filter(b => b.issuer.toLowerCase().includes(q) || b.symbol.toLowerCase().includes(q))
            .forEach(b => results.push({ ...b, assetClass: "bond" }));
    }
    if (!type || type === "etf") {
        mockETFs.filter(e => e.name.toLowerCase().includes(q) || e.symbol.toLowerCase().includes(q))
            .forEach(e => results.push({ ...e, assetClass: "etf" }));
    }
    if (!type || type === "mutual_fund") {
        mockMutualFunds.filter(f => f.name.toLowerCase().includes(q) || f.symbol.toLowerCase().includes(q))
            .forEach(f => results.push({ ...f, assetClass: "mutual_fund" }));
    }
    if (!type || type === "commodity") {
        mockCommodities.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
            .forEach(c => results.push({ ...c, assetClass: "commodity" }));
    }

    return corsResponse({ results, total: results.length }, 200, origin);
}
