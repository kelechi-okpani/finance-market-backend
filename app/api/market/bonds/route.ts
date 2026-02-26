import { NextRequest } from "next/server";
import { mockBonds } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/bonds?type=government&market=NASDAQ
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let bonds = [...mockBonds];

    if (type) bonds = bonds.filter(b => b.type === type);
    if (search) bonds = bonds.filter(b =>
        b.issuer.toLowerCase().includes(search.toLowerCase()) ||
        b.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return corsResponse({
        bonds,
        total: bonds.length,
        availableTypes: ["government", "corporate", "municipal", "high_yield"],
    }, 200, origin);
}
