import { NextResponse } from 'next/server';
// import { getMarketData, SYMBOL_REGISTRY } from '@/lib/stock-utils';
import MarketItem from '@/lib/models/financeStock';
import dbConnect from '@/lib/db';
import { getMarketData, SYMBOL_REGISTRY } from '@/lib/stock-utils';



// export async function GET(request: Request) {
//     await dbConnect();
//     const { searchParams } = new URL(request.url);

//     // --- Phase 1: Pagination Parameters ---
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '21');
//     const skip = (page - 1) * limit;

//     // --- Phase 1: Search & Filter Parameters ---
//     const search = searchParams.get('search');
//     const category = searchParams.get('category'); // e.g., 'Stock', 'Crypto', 'Forex'
//     const status = searchParams.get('status');     // 'active' or 'inactive'

//     // Build the MongoDB Query
//     let dbQuery: any = {};

//     // Search by Symbol or Name
//     if (search) {
//         dbQuery.$or = [
//             { symbol: { $regex: search, $options: 'i' } },
//             { name: { $regex: search, $options: 'i' } }
//         ];
//     }

//     // Filter by Type/Category
//     if (category && category !== 'all') {
//         dbQuery.type = category;
//     }

//     // Filter by Active Status
//     if (status === 'active') dbQuery.isActive = true;
//     if (status === 'inactive') dbQuery.isActive = false;

//     try {
//         // Fetch data from MongoDB (Phase 1 & 3)
//         const total = await MarketItem.countDocuments(dbQuery);
//         const stocks = await MarketItem.find(dbQuery)
//             .sort({ symbol: 1 }) // Sort alphabetically
//             .skip(skip)
//             .limit(limit);

//         // If DB is empty, or you want to force a refresh of specific symbols, 
//         // you can still call getMarketData() here, but for pagination 
//         // it's better to rely on the background CRON job to keep the DB full.

//         const response = NextResponse.json({
//             success: true,
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit)
//             },
//             results: stocks // Phase 3: These objects contain full details
//         });

//         // --- CORS HEADERS ---
//         response.headers.set('Access-Control-Allow-Origin', '*');
//         response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
//         response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//         return response;

//     } catch (err) {
//         return NextResponse.json(
//             { error: "Database query failed." },
//             { status: 500 }
//         );
//     }
// }


export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '21');
    const skip = (page - 1) * limit;

    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let dbQuery: any = {};
    if (search) {
        dbQuery.$or = [
            { symbol: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }
    if (category && category !== 'all') dbQuery.type = category;
    if (status === 'active') dbQuery.isActive = true;
    if (status === 'inactive') dbQuery.isActive = false;

    try {
        // 1. Initial Check
        let total = await MarketItem.countDocuments(dbQuery);

        // 2. SELF-HEALING: If DB is empty and no specific search is active, seed it!
        if (total === 0 && !search && (!category || category === 'all')) {
            console.log("Database empty. Seeding from Registry...");
            const allSymbols = Object.values(SYMBOL_REGISTRY).flat();
            await getMarketData(allSymbols); 
            // Refresh the total after seeding
            total = await MarketItem.countDocuments(dbQuery);
        }

        // 3. Fetch Data
        const stocks = await MarketItem.find(dbQuery)
            .sort({ symbol: 1 })
            .skip(skip)
            .limit(limit);

        const response = NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            results: stocks
        });

        // CORS Headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;

    } catch (err) {
        console.error("API Error:", err);
        return NextResponse.json({ error: "Query failed." }, { status: 500 });
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

