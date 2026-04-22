import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import PortfolioInheritance from "@/lib/models/PortfolioInheritance";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import mongoose from "mongoose";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import Portfolio from "@/lib/models/Portfolio";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/inheritance/request
 * Allows a beneficiary to claim a portfolio by providing the original owner's email and legal proof.
 */

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    
    // 1. Authenticate the User
    const auth = await requireAuth(request);
    if (auth.error || !auth.user) {
        return auth.error || corsResponse({ error: "Unauthorized" }, 401, origin);
    }

    const currentUser = auth.user;

    try {
        await connectDB();

        // 2. Find transfers where:
        // - recipientEmail matches the logged-in user
        // - status is 'awaiting_recipient_claim' (Authorized by Admin)
        const incomingTransfers = await PortfolioTransfer.find({
            recipientEmail: currentUser.email.toLowerCase(),
            status: "awaiting_recipient_claim"
        })
        .sort({ createdAt: -1 })
        .lean();

        // 3. Return the list
        return corsResponse({ 
            transfers: incomingTransfers,
            count: incomingTransfers.length 
        }, 200, origin);

    } catch (error: any) {
        console.error("Fetch Incoming Transfers Error:", error);
        return corsResponse({ error: "Failed to fetch incoming transfers." }, 500, origin);
    }
}


export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const auth = await requireAuth(request);
    
    if (auth.error || !auth.user) {
        return auth.error || corsResponse({ error: "Unauthorized" }, 401, origin);
    }

    const currentUser = auth.user;

    try {
        const { transferId } = await request.json();

        await connectDB();

        // 1. Find the transfer record
        const transfer = await PortfolioTransfer.findById(transferId);
        
        if (!transfer || transfer.status !== 'awaiting_recipient_claim') {
            throw new Error("This transfer is not ready to be claimed or has already been processed.");
        }

        // 2. Security Check
        if (transfer.recipientEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
            throw new Error("You are not the authorized recipient for this portfolio.");
        }

        const portfolioId = transfer.portfolioId;
        const originalOwnerId = transfer.senderId;

        // 3. THE HANDOFF
        await Portfolio.findByIdAndUpdate(portfolioId, {
            $set: { 
                userId: currentUser._id, 
                status: 'active',
                source: 'transferred'
            }
        });

        // 4. Update User reference arrays
        await User.findByIdAndUpdate(originalOwnerId, { $pull: { portfolios: portfolioId } });
        await User.findByIdAndUpdate(currentUser._id, { $addToSet: { portfolios: portfolioId } });

        // 5. Finalize the transfer record
        transfer.status = 'completed';
        transfer.recipientId = currentUser._id;
        transfer.resolvedAt = new Date(); // Changed to completedAt for clarity
        await transfer.save();

        return corsResponse({ message: "Portfolio successfully added to your account!" }, 200, origin);

    } catch (error: any) {
        console.error("Claim Execution Error:", error.message);
        return corsResponse({ error: error.message || "Failed to claim portfolio." }, 500, origin);
    }
}

// export async function POST(request: NextRequest) {
//     const origin = request.headers.get("origin");
//     const auth = await requireAuth(request);
    
//     if (auth.error || !auth.user) {
//         return auth.error || corsResponse({ error: "Unauthorized" }, 401, origin);
//     }

//     const currentUser = auth.user;

//     try {
//         const { transferId } = await request.json(); // The ID of the transfer record

//         await connectDB();
//         const session = await mongoose.startSession();
//         session.startTransaction();

//         try {
//             // 1. Find the transfer record that was already authorized by Admin
//             const transfer = await PortfolioTransfer.findById(transferId).session(session);
            
//             if (!transfer || transfer.status !== 'awaiting_recipient_claim') {
//                 throw new Error("This transfer is not ready to be claimed or has already been processed.");
//             }

//             // 2. Security Check: Is the logged-in user the one the admin authorized?
//             if (transfer.recipientEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
//                 throw new Error("You are not the authorized recipient for this portfolio.");
//             }

//             const portfolioId = transfer.portfolioId;
//             const originalOwnerId = transfer.senderId;

//             // 3. THE HANDOFF: Update Portfolio Ownership
//             // We use findByIdAndUpdate to bypass the asset validation (price error)
//             await Portfolio.findByIdAndUpdate(portfolioId, {
//                 $set: { 
//                     userId: currentUser._id, // Set to the person claiming it
//                     status: 'active',
//                     source: 'transferred'
//                 }
//             }).session(session);

//             // 4. Update User reference arrays (Clean up both dashboards)
//             await User.findByIdAndUpdate(originalOwnerId, { $pull: { portfolios: portfolioId } }).session(session);
//             await User.findByIdAndUpdate(currentUser._id, { $addToSet: { portfolios: portfolioId } }).session(session);

//             // 5. Finalize the transfer record
//             transfer.status = 'completed';
//             transfer.recipientId = currentUser._id;
//             transfer.resolvedAt = new Date();
//             await transfer.save({ session });

//             await session.commitTransaction();
//             return corsResponse({ message: "Portfolio successfully added to your account!" }, 200, origin);

//         } catch (innerError: any) {
//             await session.abortTransaction();
//             throw innerError;
//         } finally {
//             session.endSession();
//         }

//     } catch (error: any) {
//         console.error("Claim Execution Error:", error.message);
//         return corsResponse({ error: error.message || "Failed to claim portfolio." }, 500, origin);
//     }
// }