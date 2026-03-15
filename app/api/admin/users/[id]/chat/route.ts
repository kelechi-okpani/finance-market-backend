import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// POST /api/admin/users/[id]/chat - Admin sends a message to a specific user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const origin = request.headers.get("origin");

    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const { text } = await request.json();
        if (!text) return corsResponse({ error: "Message text is required." }, 400, origin);

        await connectDB();
        
        const user = await User.findById(id);
        if (!user) return corsResponse({ error: "User not found." }, 404, origin);

        const message = await ChatMessage.create({
            userId: id,
            sender: "admin",
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
        console.error("Admin send chat error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
