import { NextResponse } from 'next/server';
import { getMarketData, SYMBOL_REGISTRY } from '@/lib/stock-utils';
import MarketItem from '@/lib/models/financeStock';
import dbConnect from '@/lib/db';


export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Validation: Ensure isActive is actually provided as a boolean
        if (typeof body.isActive !== 'boolean') {
            return NextResponse.json(
                { success: false, error: "isActive status is required" }, 
                { status: 400 }
            );
        }

        const updated = await MarketItem.findByIdAndUpdate(
            id,
            { 
                isActive: body.isActive,
                lastUpdated: new Date() // Manual update in case 'pre-save' isn't triggered
            },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Asset not found" }, 
                { status: 404 }
            );
        }

        // Create the response
        const response = NextResponse.json({ 
            success: true, 
            message: `Asset ${updated.symbol} is now ${updated.isActive ? 'VISIBLE' : 'HIDDEN'}`,
            updated 
        });
        
        // Standard CORS Headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return response;

    } catch (err) {
        console.error("Update error:", err);
        return NextResponse.json(
            { success: false, error: "Update failed" }, 
            { status: 500 }
        );
    }
}

// Fix: params must be awaited in Next.js 15+
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await dbConnect();

    // 1. Unwrapping the params promise
    const { id } = await params;

    // 2. Fetch the item
    const item = await MarketItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    // 3. Construct response with CORS
    const response = NextResponse.json({ success: true, result: item });
    response.headers.set("Access-Control-Allow-Origin", "*");
    
    return response;
  } catch (error) {
    console.error("Single Asset Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid ID format or Server Error" },
      { status: 500 }
    );
  }
}

// Preflight handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}