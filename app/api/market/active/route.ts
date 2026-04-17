import { NextResponse } from "next/server";
import MarketItem from '@/lib/models/stockUtils';
import dbConnect from '@/lib/db';

export async function GET(request: Request) {
    try {
        await dbConnect();

        // 1. Fetch only items where isActive is true
        // 2. Sort by name or symbol for a better user experience
        const activeAssets = await MarketItem.find({ isActive: true })
            .sort({ name: 1 })
            .select("-__v")
            .lean();
            
        return NextResponse.json({
            success: true,
            count: activeAssets.length,
            results: activeAssets
        }, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store",
                // "Cache-Control": "s-maxage=60, stale-while-revalidate" 
            }
        });

    } catch (error) {
        console.error("Fetch Active Assets Error:", error);
        return NextResponse.json(
            { success: false, error: "Unable to fetch market data" },
            { status: 500 }
        );
    }
}