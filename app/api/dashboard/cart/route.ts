import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import CartItem from "@/lib/models/CartItem";
import Portfolio from "@/lib/models/Portfolio";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        // Use auth.user.id or auth.user._id depending on your auth helper structure
        const items = await CartItem.find({ userId: auth?.user?._id }).sort({ createdAt: -1 });
        
        const subtotal = items.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

        return corsResponse({ items, subtotal, count: items.length }, 200, origin);
    } catch (error) {
        console.error("Cart GET error:", error);
        return corsResponse({ error: "Failed to retrieve cart items." }, 500, origin);
    }
}

// export async function POST(request: NextRequest) {
//     const origin = request.headers.get("origin");
//     const auth = await requireAuth(request);
//     if (auth.error) return auth.error;

//     try {
//         const body = await request.json();
        
//         // Destructure and map from MarketItem names to CartItem names
//         const { 
//             symbol, 
//             name,          
//             price,         
//             logo, 
//             shares, 
//             type, 
//             portfolioId 
//         } = body;

//         if (!portfolioId || !symbol) {
//             return corsResponse({ error: "Portfolio and Symbol are required." }, 400, origin);
//         }

//         await connectDB();

//         // Validate Portfolio
//         const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: auth?.user?._id });
//         if (!portfolio || portfolio.status !== 'active') {
//             return corsResponse({ error: "Portfolio invalid or locked." }, 400, origin);
//         }

//         const numShares = Number(shares);
//         const numPrice = Number(price);
//         const totalAmount = numShares * numPrice;

//         // Finance Logic: Upsert based on key identifiers
//         // If the same stock is added twice, we update the quantity and total
//         const cartItem = await CartItem.findOneAndUpdate(
//             { 
//                 userId: auth?.user?._id, 
//                 symbol: symbol.toUpperCase(), 
//                 type, 
//                 portfolioId 
//             },
//             { 
//                 $set: { 
//                     name: name, // Explicit mapping
//                     price: numPrice,
//                     logo,
//                     currency: body.currency || "USD"
//                 },
//                 $inc: { 
//                     shares: numShares,
//                     totalAmount: totalAmount 
//                 }
//             },
//             { upsert: true, new: true, runValidators: true }
//         );

//         return corsResponse({ message: "Acquisition vault updated", cartItem }, 201, origin);
//     } catch (error) {
//         console.error("Cart Finance Error:", error);
//         return corsResponse({ error: "Failed to process stock order." }, 500, origin);
//     }
// }



// export async function PATCH(request: NextRequest) {
//     const origin = request.headers.get("origin");
//     const auth = await requireAuth(request);
//     if (auth.error) return auth.error;

//     try {
//         const body = await request.json();
//         const { itemId, shares } = body;

//         if (!itemId || shares === undefined) {
//             return corsResponse({ error: "Item ID and shares are required." }, 400, origin);
//         }

//         const numShares = Number(shares);
//         if (numShares <= 0) {
//             return corsResponse({ error: "Shares must be greater than zero. Use DELETE to remove." }, 400, origin);
//         }

//         await connectDB();

//         // 1. Find the item to check its type and portfolio
//         const cartItem = await CartItem.findOne({ _id: itemId, userId: auth?.user?._id });
//         if (!cartItem) {
//             return corsResponse({ error: "Cart item not found." }, 404, origin);
//         }

//         if (cartItem) {
//             cartItem.shares = Number(shares);
//             cartItem.totalAmount = cartItem.shares * cartItem.pricePerShare; 
//             await cartItem.save();
//         }

//         // 2. If it's a SELL, re-validate against the Portfolio assets
//         if (cartItem.type === 'sell') {
//             const portfolio = await Portfolio.findById(cartItem.portfolioId);
//             const asset = portfolio?.assets.find((a: any) => a.symbol === cartItem.symbol);
            
//             if (!asset || asset.shares < numShares) {
//                 return corsResponse({ 
//                     error: `Insufficient shares in portfolio. Available: ${asset?.shares || 0}` 
//                 }, 400, origin);
//             }
//         }

//         // 3. Update the item
//         cartItem.shares = numShares;
//         // totalAmount is auto-calculated by the Pre-save hook we added to the model
//         await cartItem.save();

//         return corsResponse({ 
//             message: "Quantity updated", 
//             cartItem 
//         }, 200, origin);

//     } catch (error) {
//         console.error("Cart PATCH error:", error);
//         return corsResponse({ error: "Failed to update quantity." }, 500, origin);
//     }
// }

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        
        // 1. Capture EVERYTHING from the incoming body
        const { 
            symbol, 
            name,           
            price, // This is the unit price from the frontend          
            logo, 
            shares, 
            type, 
            portfolioId,
            industry,
            change_percent,
            marketCap,
            assetType,
            high,
            low,
            open,
            prev_close,
            isActive,
            currency
        } = body;

        if (!portfolioId || !symbol) {
            return corsResponse({ error: "Portfolio and Symbol are required." }, 400, origin);
        }

        await connectDB();

        // 2. Validate Portfolio
        const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: auth?.user?._id });
        if (!portfolio || portfolio.status !== 'active') {
            return corsResponse({ error: "Portfolio invalid or locked." }, 400, origin);
        }

        const numShares = Number(shares);
        const numPrice = Number(price);
        const totalAmount = numShares * numPrice;

        // 3. The Upsert Logic
        const cartItem = await CartItem.findOneAndUpdate(
            { 
                userId: auth?.user?._id, 
                symbol: symbol.toUpperCase(), 
                type, 
                portfolioId 
            },
            { 
                $set: { 
                    name: name,
                    logo: logo,
                    industry: industry,
                    currency: currency || "USD",
                    
                    // Critical: Map 'price' to both for schema consistency
                    price: numPrice, 
                    pricePerShare: numPrice, 
                    type: type,
                    // Capture Snapshots
                    change_percent: change_percent,
                    marketCap: marketCap,
                    assetType: type || 'Stock',
                    high: high,
                    low: low,
                    open: open,
                    prev_close: prev_close,
                    isActive: isActive !== undefined ? isActive : true,
                    lastUpdated: new Date()
                },
                $inc: { 
                    shares: numShares,
                    // If your CartItem uses the pre-save hook, 
                    // be careful with manual $inc on totalAmount.
                    // But for findOneAndUpdate, we manually increment it:
                    totalAmount: totalAmount 
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        return corsResponse({ message: "Acquisition vault updated", cartItem }, 201, origin);
    } catch (error) {
        console.error("Cart Finance Error:", error);
        return corsResponse({ error: "Failed to process stock order." }, 500, origin);
    }
}

export async function PATCH(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const body = await request.json();
        const { itemId, shares } = body;

        console.log(itemId, "items...")

        if (!itemId || shares === undefined) {
            return corsResponse({ error: "Item ID and shares are required." }, 400, origin);
        }

        const numShares = Number(shares);
        if (numShares <= 0) {
            return corsResponse({ error: "Shares must be greater than zero. Use DELETE to remove." }, 400, origin);
        }

        // 1. Find the item
        const cartItem = await CartItem.findOne({ _id: itemId, userId: auth?.user?._id });
        if (!cartItem) {
            return corsResponse({ error: "Cart item not found." }, 404, origin);
        }

        if (!cartItem.name) {
            cartItem.name = cartItem.name || cartItem.symbol || "Unknown Asset";
        }

        // Fix for the 'change' error and other snapshot fields
        if (cartItem.change === undefined) cartItem.change = 0;
        if (cartItem.change_percent === undefined) cartItem.change_percent = 0;
        if (cartItem.pricePerShare === undefined) cartItem.pricePerShare = cartItem.price || 0;
        // ------------------------------------

        
        // 2. CRITICAL: Validate 'sell' logic BEFORE saving anything
        if (cartItem.type === 'sell') {
            const portfolio = await Portfolio.findById(cartItem.portfolioId);
            const asset = portfolio?.assets.find((a: any) => a.symbol === cartItem.symbol);
            
            if (!asset || asset.shares < numShares) {
                return corsResponse({ 
                    error: `Insufficient shares in portfolio. Available: ${asset?.shares || 0}` 
                }, 400, origin);
            }
        }

        // 3. Update fields
        cartItem.shares = numShares;
        
        /** * Note: We don't need to manually calculate totalAmount here 
         * because your 'pre-save' hook in the model handles it.
         * this.totalAmount = Number((this.shares * this.pricePerShare).toFixed(2));
         */

        await cartItem.save();

        return corsResponse({ 
            message: "Quantity updated successfully", 
            cartItem 
        }, 200, origin);

    } catch (error: any) {
        console.error("Cart PATCH error:", error);
        return corsResponse({ error: error.message || "Failed to update quantity." }, 500, origin);
    }
}



export async function DELETE(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");

        await connectDB();

        // Specific Item Delete
        if (itemId) {
            const result = await CartItem.deleteOne({ 
                _id: itemId, 
                userId: auth?.user?._id // Explicitly use verified ID
            });

            if (result.deletedCount === 0) {
                return corsResponse({ error: "Item not found or unauthorized" }, 404, origin);
            }
            return corsResponse({ message: "Item removed from cart" }, 200, origin);
        }

        // Bulk Delete (Clear Cart)
        const result = await CartItem.deleteMany({ userId: auth?.user?._id });
        return corsResponse({ 
            message: "Cart cleared", 
            count: result.deletedCount 
        }, 200, origin);

    } catch (error) {
        console.error("Cart DELETE error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

