import { NextResponse } from 'next/server';
import { getMarketData, SYMBOL_REGISTRY } from '@/lib/stock-utils';

export async function GET(request: Request) {
    // 1. Security check: Ensure only Vercel can call this
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 2. Collect every single symbol you track
        const allSymbols = Object.values(SYMBOL_REGISTRY).flat();
        
        // 3. Trigger the update (which also saves to MongoDB via your bulkWrite logic)
        await getMarketData(allSymbols);

        return NextResponse.json({ 
            success: true, 
            message: `Synced ${allSymbols.length} symbols to MongoDB` 
        });
    } catch (err) {
        return NextResponse.json({ error: "Cron sync failed" }, { status: 500 });
    }
}