import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AdminSettings from "@/lib/models/AdminSettings";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import { ALL_COUNTRIES } from "@/lib/data/countries";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/admin/settings/countries
 * Get all available countries and currently allowed countries.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({
                allowedCountries: [],
                allowedRegions: []
            });
        }

        return corsResponse({
            allCountries: ALL_COUNTRIES,
            allowedCountries: settings.allowedCountries
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to fetch countries", details: err.message }, 500, origin);
    }
}

/**
 * POST /api/admin/settings/countries
 * Set the list of countries that the user will see.
 * Payload: { allowedCountries: string[] }
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const body = await request.json();
        const { allowedCountries } = body;

        if (!Array.isArray(allowedCountries)) {
            return corsResponse({ error: "allowedCountries must be an array of strings." }, 400, origin);
        }

        await connectDB();

        const settings = await AdminSettings.findOneAndUpdate(
            {},
            { $set: { allowedCountries } },
            { upsert: true, new: true }
        );

        return corsResponse({
            message: "Allowed countries updated successfully.",
            allowedCountries: settings.allowedCountries
        }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to update countries", details: err.message }, 500, origin);
    }
}
