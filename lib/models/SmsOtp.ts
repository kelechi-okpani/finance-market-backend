import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISmsOtp extends Document {
    phone: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

const SmsOtpSchema: Schema = new Schema(
    {
        phone: { type: String, required: true, unique: true, trim: true },
        otp: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

// Auto-delete expired OTPs using MongoDB TTL index
SmsOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SmsOtp: Model<ISmsOtp> =
    mongoose.models.SmsOtp || mongoose.model<ISmsOtp>("SmsOtp", SmsOtpSchema);

export default SmsOtp;
