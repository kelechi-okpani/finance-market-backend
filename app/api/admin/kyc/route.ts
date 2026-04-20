import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import mongoose from "mongoose";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const role = searchParams.get("role");
        const search = searchParams.get("search"); // Added search support
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // 1. Build Filter Match Stage
        const matchStage: any = {};
        matchStage.role = role ? role : { $ne: "admin" };
        
        if (status) matchStage.accountStatus = status;
        
        if (search) {
            matchStage.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        // 2. High Performance Aggregation
        const result = await User.aggregate([
            { $match: matchStage },
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                // Join KYCDocuments
                $lookup: {
                    from: "kycdocuments", // Check your actual collection name in MongoDB (usually lowercase plural)
                    localField: "_id",
                    foreignField: "userId",
                    as: "kycDocs"
                }
            },
            {
                // Join AddressVerifications
                $lookup: {
                    from: "addressverifications", 
                    localField: "_id",
                    foreignField: "userId",
                    as: "addressDocs"
                }
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    status: 1,
                    accountStatus: 1,
                    kycVerified: 1,
                    onboardingStep: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    documents: {
                        kyc: "$kycDocs",
                        address: "$addressDocs"
                    }
                }
            }
        ]);

        const total = await User.countDocuments(matchStage);

        return corsResponse({
            users: result,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, origin);

    } catch (err: any) {
        console.error("Admin KYC list error:", err);
        return corsResponse({ error: "Failed to fetch KYC data" }, 500, origin);
    }
}