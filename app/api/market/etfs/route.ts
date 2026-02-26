import { NextRequest } from "next/server";
import { mockETFs } from "@/lib/mock-data";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/market/etfs?isIndexBased=true&isActivelyManaged=false&search=vanguard
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const isIndexBased = searchParams.get("isIndexBased");
    const isActivelyManaged = searchParams.get("isActivelyManaged");

    let etfs = [...mockETFs];

    if (isIndexBased !== null) etfs = etfs.filter(e => e.isIndexBased === (isIndexBased === "true"));
    if (isActivelyManaged !== null) etfs = etfs.filter(e => e.isActivelyManaged === (isActivelyManaged === "true"));
    if (search) etfs = etfs.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return corsResponse({ etfs, total: etfs.length }, 200, origin);
}
