import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/chat/debug
 * Debug endpoint - returns raw data about user's chat messages
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const userId = auth.user!._id;
        const userIdStr = userId.toString();

        // Direct raw query to bypass any Mongoose casting issues
        const db = mongoose.connection.db;
        const rawMessages = await db!.collection("chatmessages").find({}).toArray();

        // Filter manually for this user
        const userMessages = rawMessages.filter((msg: any) => {
            const msgUserId = msg.userId?.toString();
            return msgUserId === userIdStr;
        });

        return corsResponse({
            debug: {
                authenticatedUserId: userIdStr,
                authenticatedUserIdType: typeof userId,
                totalMessagesInDB: rawMessages.length,
                messagesForThisUser: userMessages.length,
                allUserIdsInDB: [...new Set(rawMessages.map((m: any) => m.userId?.toString()))],
                sampleMessages: userMessages.slice(0, 5).map((m: any) => ({
                    _id: m._id?.toString(),
                    userId: m.userId?.toString(),
                    userIdType: typeof m.userId,
                    sender: m.sender,
                    text: m.text?.substring(0, 50),
                    conversationId: m.conversationId,
                    hasConversationId: !!m.conversationId
                }))
            }
        }, 200, origin);
    } catch (error: any) {
        console.error("Debug chat error:", error);
        return corsResponse({ error: "Debug failed.", details: error.message }, 500, origin);
    }
}
