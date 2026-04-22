import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import PortfolioTransfer from "@/lib/models/PortfolioTransfer";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}



export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const { action, adminNotes } = await request.json(); 

  await connectDB();

  try {
    // 1. Fetch Transfer Record
    const transfer = await PortfolioTransfer.findById(id);
    if (!transfer || transfer.status !== 'pending') {
        throw new Error("Transfer request not found or already processed.");
    }

    let newTransferStatus = '';
    let newPortfolioStatus = '';

    // 2. Determine statuses based on action
    if (action === 'accepted') {
      newTransferStatus = 'awaiting_recipient_claim';
      newPortfolioStatus = 'pending_claim';
    } else if (action === 'rejected') {
      newTransferStatus = 'rejected';
      newPortfolioStatus = 'active'; // Return portfolio to sender's active list
    } else {
      // CRITICAL: Re-add this check so undefined/wrong actions don't pass
      throw new Error(`Invalid action: ${action}`);
    }

    // 3. Update Portfolio Status
    // Using findByIdAndUpdate bypasses strict validation on the assets array
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      transfer.portfolioId, 
      { $set: { status: newPortfolioStatus } },
      { new: true }
    );

    if (!updatedPortfolio) throw new Error("The associated portfolio was not found.");

    // 4. Update Transfer Record
    // We use findByIdAndUpdate here too to avoid any price-related validation errors
    const updatedTransfer = await PortfolioTransfer.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: newTransferStatus,
          adminNotes: adminNotes || transfer.adminNotes,
          resolvedAt: new Date()
        } 
      },
      { new: true }
    );

    return corsResponse({ 
      message: `Transfer ${action === 'accepted' ? 'authorized' : 'rejected'} successfully.`,
      status: updatedTransfer?.status
    }, 200, origin);

  } catch (error: any) {
    console.error("Admin Approval Error:", error.message);
    return corsResponse({ error: error.message || "Failed to process approval." }, 500, origin);
  }
}