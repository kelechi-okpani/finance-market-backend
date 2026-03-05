import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AdminSettings from "@/lib/models/AdminSettings";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/settings
 * Admin tool to get site settings.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({});
        }

        return corsResponse({ settings }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch settings", details: err.message }, 500, origin);
    }
}

/**
 * PUT /api/admin/settings
 * Admin tool to update site settings.
 */
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const body = await request.json();

        await connectDB();

        const settings = await AdminSettings.findOneAndUpdate(
            {},
            { $set: body },
            { upsert: true, new: true }
        );

        return corsResponse({ message: "Settings updated successfully.", settings }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update settings", details: err.message }, 500, origin);
    }
}
