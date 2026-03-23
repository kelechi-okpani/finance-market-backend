import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/support/admin/chat/[userId]
 * Admin retrieves chat history for a specific user.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { userId } = await params;
        await connectDB();
        
        const convoId = `conv_${userId}`;

        // Admin searches by both ID and conversationId for robustness
        const messages = await ChatMessage.find({ 
            $or: [
                { userId: userId },
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
            message: "User chat history retrieved.",
            data: history
        }, 200, origin);
    } catch (error) {
        console.error("Admin chat history error:", error);
        return corsResponse({ success: false, message: "Internal server error." }, 500, origin);
    }
}
