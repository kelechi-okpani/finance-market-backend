import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete after expiresAt
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for fast lookup
OTPSchema.index({ email: 1, otp: 1 });

const OTP: Model<IOTP> =
    mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);

export default OTP;
