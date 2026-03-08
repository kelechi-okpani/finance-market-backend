import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AdminSettings from "@/lib/models/AdminSettings";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * PATCH /api/admin/settings/toggle
 * Toggle a country or region on/off.
 * Payload: { type: 'country' | 'region', value: string, enabled: boolean }
 */
export async function PATCH(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const { type, value, enabled } = await request.json();

        if (!value || typeof enabled !== 'boolean') {
            return corsResponse({ error: "Value and enabled (boolean) are required." }, 400, origin);
        }

        await connectDB();

        let settings = await AdminSettings.findOne();
        if (!settings) settings = await AdminSettings.create({});

        if (type === 'country') {
            if (enabled) {
                if (!settings.allowedCountries.includes(value)) {
                    settings.allowedCountries.push(value);
                }
            } else {
                settings.allowedCountries = settings.allowedCountries.filter(c => c !== value);
            }
        } else if (type === 'region') {
            if (enabled) {
                if (!settings.allowedRegions.includes(value)) {
                    settings.allowedRegions.push(value);
                }
            } else {
                settings.allowedRegions = settings.allowedRegions.filter(r => r !== value);
            }
        } else {
            return corsResponse({ error: "Invalid type. Must be 'country' or 'region'." }, 400, origin);
        }

        await settings.save();

        return corsResponse({ message: `${value} ${enabled ? 'enabled' : 'disabled'} successfully.`, settings }, 200, origin);

    } catch (err: any) {
        return corsResponse({ error: "Failed to toggle setting", details: err.message }, 500, origin);
    }
}
