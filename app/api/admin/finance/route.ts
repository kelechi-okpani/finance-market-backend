import { NextResponse } from 'next/server';
import { getMarketData, SYMBOL_REGISTRY } from '@/lib/stock-utils';
import MarketItem from '@/lib/models/stockUtils';
import dbConnect from '@/lib/db';



export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // --- Phase 1: Pagination Parameters ---
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '21');
    const skip = (page - 1) * limit;

    // --- Phase 1: Search & Filter Parameters ---
    const search = searchParams.get('search');
    const category = searchParams.get('category'); // e.g., 'Stock', 'Crypto', 'Forex'
    const status = searchParams.get('status');     // 'active' or 'inactive'

    // Build the MongoDB Query
    let dbQuery: any = {};

    // Search by Symbol or Name
    if (search) {
        dbQuery.$or = [
            { symbol: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by Type/Category
    if (category && category !== 'all') {
        dbQuery.type = category;
    }

    // Filter by Active Status
    if (status === 'active') dbQuery.isActive = true;
    if (status === 'inactive') dbQuery.isActive = false;

    try {
        // Fetch data from MongoDB (Phase 1 & 3)
        const total = await MarketItem.countDocuments(dbQuery);
        const stocks = await MarketItem.find(dbQuery)
            .sort({ symbol: 1 }) // Sort alphabetically
            .skip(skip)
            .limit(limit);

        // If DB is empty, or you want to force a refresh of specific symbols, 
        // you can still call getMarketData() here, but for pagination 
        // it's better to rely on the background CRON job to keep the DB full.

        const response = NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            results: stocks // Phase 3: These objects contain full details
        });

        // --- CORS HEADERS ---
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;

    } catch (err) {
        return NextResponse.json(
            { error: "Database query failed." },
            { status: 500 }
        );
    }
}

// --- Phase 2: Toggle Active Status ---
export async function PATCH(request: Request) {
    await dbConnect();
    try {
        const { symbol, isActive } = await request.json();
        
        if (!symbol) {
            return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
        }

        const updated = await MarketItem.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { isActive },
            { new: true } // Returns the updated document
        );

        if (!updated) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 });
        }

        const response = NextResponse.json({ success: true, updated });
        
        // CORS Headers for PATCH
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;

    } catch (err) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}


export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}



// export async function GET(request: Request) {
//     const { searchParams } = new URL(request.url);
//     const category = searchParams.get('category');
//     const query = searchParams.get('symbols');

//     let symbols: string[] = [];

//     // --- FIX: Logic to ensure we get MORE data by default ---
//     if (category === 'all') {
//         symbols = Object.values(SYMBOL_REGISTRY).flat();
//     } else if (category && SYMBOL_REGISTRY[category]) {
//         symbols = SYMBOL_REGISTRY[category];
//     } else if (query) {
//         symbols = query.split(',').filter(Boolean);
//     } else {
//         // Default to the full US stocks list + Bitcoin + NGN Forex
//         symbols = [...SYMBOL_REGISTRY.stocks_us, "BINANCE:BTCUSDT", "FXP:USD_NGN"];
//     }

//     try {
//         const data = await getMarketData(symbols);

//         const response = NextResponse.json({
//             success: true,
//             count: data.size, // Helpful to see how many items you got
//             results: Object.fromEntries(data)
//         });

//         // --- ADD CORS HEADERS ---
//         response.headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain
//         response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
//         response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//         return response;

//     } catch (err) {
//         return NextResponse.json(
//             { error: "Failed to fetch market data from Finnhub." },
//             { status: 500 }
//         );
//     }
// }