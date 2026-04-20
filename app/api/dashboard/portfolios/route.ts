import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Portfolio from "@/lib/models/Portfolio";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/portfolios
 * Fetches all portfolios for the user. 
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    // Fetches portfolios. 
    // We leverage the { userId: 1, status: 1 } index.
    const portfolios = await Portfolio.find({
      userId: auth.user!._id,
    }).sort({ createdAt: -1 });

    return corsResponse({ portfolios, count: portfolios.length }, 200, origin);
  } catch (error) {
    console.error("Portfolio GET error:", error);
    return corsResponse({ error: "Failed to fetch portfolios." }, 500, origin);
  }
}

/**
 * POST /api/portfolios
 * Creates a new portfolio with an empty assets array.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, description, baseCurrency, source } = body;

    if (!name || name.trim().length < 3) {
      return corsResponse({ error: "Portfolio name must be at least 3 characters." }, 400, origin);
    }

    await connectDB();

    // Case-insensitive duplicate check for this user
    const existingPortfolio = await Portfolio.findOne({
      userId: auth.user!._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingPortfolio) {
      return corsResponse({ error: "A portfolio with this name already exists." }, 400, origin);
    }

    // Create the new portfolio with embedded architecture defaults
    const portfolio = await Portfolio.create({
      userId: auth.user!._id,
      name: name.trim(),
      description,
      baseCurrency: baseCurrency || "USD",
      source: source || "created",
      assets: [], // Explicitly initialize the empty container for market items
      totalValue: 0,
      totalInvested: 0,
      status: "active"
    });

    return corsResponse(
      { message: "Portfolio initialized successfully", portfolio },
      201,
      origin
    );
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return corsResponse({ error: "Failed to initialize portfolio." }, 500, origin);
  }
}