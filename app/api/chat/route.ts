import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/chat - Get user's chat history
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const messages = await ChatMessage.find({ userId: auth.user!._id }).sort({ createdAt: 1 });

        const mappedMessages = messages.map(msg => ({
            id: msg._id,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));

        return corsResponse({ chatHistory: mappedMessages }, 200, origin);
    } catch (error) {
        console.error("Fetch chat error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// POST /api/chat - User sends a message
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const { text } = await request.json();
        if (!text) return corsResponse({ error: "Message text is required." }, 400, origin);

        await connectDB();
        const message = await ChatMessage.create({
            userId: auth.user!._id,
            sender: "user",
            text
        });

        return corsResponse({ 
            message: "Message sent.", 
            chatMessage: {
                id: message._id,
                sender: message.sender,
                text: message.text,
                timestamp: message.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            } 
        }, 201, origin);
    } catch (error) {
        console.error("Send chat message error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
