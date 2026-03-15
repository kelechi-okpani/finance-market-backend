import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage extends Document {
    userId: mongoose.Types.ObjectId;
    conversationId: string;
    sender: "user" | "admin";
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        conversationId: {
            type: String,
            required: true,
            index: true,
        },
        sender: {
            type: String,
            enum: ["user", "admin"],
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const ChatMessage: Model<IChatMessage> =
    mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
