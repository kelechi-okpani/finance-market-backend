import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/stock-utils';

const SYMBOL_REGISTRY: Record<string, string[]> = {
    indices: ["^GSPC", "^IXIC", "^DJI", "^FTSE", "^N225", "^NSE30.LG"],
    stocks_us: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"],
    stocks_ng: ["ZENITHBANK.LG", "GTCO.LG", "DANGCEM.LG", "MTNN.LG", "ACCESSCORP.LG", "UBA.LG"],
    crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD"],
    forex: ["USDNGN=X", "EURUSD=X", "GBPUSD=X"],
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('symbols');
    const category = searchParams.get('category');

    let symbols: string[] = [];

    if (category === 'all') {
        symbols = Object.values(SYMBOL_REGISTRY).flat();
    } else if (category && SYMBOL_REGISTRY[category]) {
        symbols = SYMBOL_REGISTRY[category];
    } else if (query) {
        symbols = query.split(',').filter(Boolean);
    } else {
        symbols = ["^GSPC", "AAPL", "BTC-USD", "USDNGN=X"];
    }

    try {
        const data = await getMarketData(symbols);

        return NextResponse.json({
            success: true,
            results: Object.fromEntries(data)
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Yahoo Finance is currently blocking requests. Try using a VPN or mobile hotspot." },
            { status: 503 }
        );
    }
}