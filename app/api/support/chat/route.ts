import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/support/chat
 * User retrieves their own chat history.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        
        const userId = auth.user!._id;
        const userIdStr = userId.toString();
        const convoId = `conv_${userIdStr}`;

        // Search by both ID types and Conversation ID for maximum compatibility
        // This handles cases where userId was saved as a String vs search by ObjectId
        const messages = await ChatMessage.find({ 
            $or: [
                { userId: userId },
                { userId: userIdStr },
                { conversationId: convoId }
            ]
        }).sort({ createdAt: 1 });

        const history = messages.map(msg => ({
            id: msg._id.toString(),
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            conversationId: msg.conversationId || convoId
        }));

        return corsResponse({
            success: true,
            message: "Chat history retrieved.",
            data: history
        }, 200, origin);
    } catch (error) {
        console.error("User chat history error:", error);
        return corsResponse({ success: false, message: "Internal server error." }, 500, origin);
    }
}
