import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentMethod extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'bank' | 'card' | 'paypal';
    label: string;
    details: any;
    isDefault: boolean;
    createdAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['bank', 'card', 'paypal'],
            required: true,
        },
        label: {
            type: String, // "Banco Santander", "Visa Card", etc.
            required: true,
        },
        details: {
            type: Schema.Types.Mixed, // Masked IBAN, last4, or email
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const PaymentMethod: Model<IPaymentMethod> =
    mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
