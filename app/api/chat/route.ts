import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/chat
 * (Legacy Alias for /api/support/chat)
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        
        // Search by both ObjectId and String to ensure compatibility
        const messages = await ChatMessage.find({ 
            $or: [
                { userId: auth.user!._id },
                { userId: auth.user!._id.toString() }
            ]
        }).sort({ createdAt: 1 });

        const mappedMessages = messages.map(msg => ({
            id: msg._id.toString(),
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            conversationId: msg.conversationId || `conv_${msg.userId}`
        }));

        // Returning the data in the exact format your frontend is expecting
        return corsResponse({ 
            success: true, 
            message: "Chat history retrieved.", 
            chatHistory: mappedMessages, // legacy key
            data: mappedMessages // matching user's new interface
        }, 200, origin);

    } catch (error: any) {
        console.error("Fetch chat error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}

/**
 * POST /api/chat
 * (Legacy Alias for /api/support/chat/send)
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { text } = await request.json();
        if (!text) return corsResponse({ error: "Message text is required." }, 400, origin);

        await connectDB();
        
        const targetUserId = auth.user!._id.toString();
        const convoId = `conv_${targetUserId}`;

        const message = await ChatMessage.create({
            userId: targetUserId,
            conversationId: convoId,
            sender: "user",
            text
        });

        const formattedMessage = {
            id: message._id.toString(),
            sender: message.sender,
            text: message.text,
            timestamp: message.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            conversationId: message.conversationId
        };

        return corsResponse({ 
            success: true,
            message: "Message sent successfully.", 
            data: formattedMessage,
            chatMessage: formattedMessage
        }, 201, origin);
    } catch (error: any) {
        console.error("Send chat message error:", error);
        return corsResponse({ error: "Internal server error.", details: error.message }, 500, origin);
    }
}
