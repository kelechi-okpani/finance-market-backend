import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import connectDB from "@/lib/db";
import AdminSettings from "@/lib/models/AdminSettings";
import { LOCATION_DATA } from "@/lib/data/locations";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/reference/locations
 * Returns location data: { [country]: { [state]: city[] } }
 * Filtered by allowedCountries in AdminSettings.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        await connectDB();
        const settings = await AdminSettings.findOne();
        const allowedCountries = settings?.allowedCountries || [];

        let locations: Record<string, Record<string, string[]>> = {};

        if (allowedCountries.length > 0) {
            // Only return countries that are explicitly allowed by the admin
            allowedCountries.forEach((country: string) => {
                if (LOCATION_DATA[country]) {
                    locations[country] = LOCATION_DATA[country];
                } else {
                    // If a country is allowed but not in our detailed data, return it with general settings
                    locations[country] = { "Other": ["Anywhere"] };
                }
            });
        } else {
            // Default to all hardcoded countries if no allowance list is set
            locations = LOCATION_DATA;
        }

        return corsResponse({ locations }, 200, origin);

    } catch (err: any) {
        console.error("Reference locations error:", err);
        return corsResponse({ error: "Failed to fetch locations", details: err.message }, 500, origin);
    }
}
