import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * POST /api/support/chat/send
 * Shared endpoint for both User and Admin to send messages.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { text, recipientId } = body;

        if (!text) {
            return corsResponse({ success: false, message: "Text is required." }, 400, origin);
        }

        await connectDB();

        let targetUserId: string;
        let senderRole: "user" | "admin";

        // Logic: If recipientId is provided, the sender is behaving as an Admin
        if (recipientId) {
            if (auth.user!.role !== "admin") {
                return corsResponse({ success: false, message: "Unauthorized. Only admins can specify a recipient." }, 403, origin);
            }
            targetUserId = recipientId;
            senderRole = "admin";

            // Verify target user exists
            const userExists = await User.exists({ _id: recipientId });
            if (!userExists) {
                return corsResponse({ success: false, message: "Recipient user not found." }, 404, origin);
            }
        } else {
            // Regular user sending to admin
            targetUserId = auth.user!._id.toString();
            senderRole = "user";
        }

        const convoId = `conv_${targetUserId}`;

        const message = await ChatMessage.create({
            userId: targetUserId,
            conversationId: convoId,
            sender: senderRole,
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
            data: formattedMessage
        }, 201, origin);

    } catch (error) {
        console.error("Send message error:", error);
        return corsResponse({ success: false, message: "Internal server error." }, 500, origin);
    }
}
