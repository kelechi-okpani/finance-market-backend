import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { GET as overviewGET } from "../overview/route";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/admin/overview
 * Proxy for /api/admin/overview to fix frontend routing issues
 */
export async function GET(request: NextRequest) {
    return overviewGET(request);
}
