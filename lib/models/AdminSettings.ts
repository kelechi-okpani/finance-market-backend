import { Schema, model, models, Document } from "mongoose";

export interface IAdminSettings extends Document {
    maintenanceMode: boolean;
    allowedRegistrations: boolean;
    investorCodePrefix: string;
    kycAutoApproval: boolean;
    siteName: string;
    supportEmail: string;
    allowedRegions: string[];
    allowedCountries: string[];
    updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>({
    maintenanceMode: { type: Boolean, default: false },
    allowedRegistrations: { type: Boolean, default: true },
    investorCodePrefix: { type: String, default: "FS" },
    kycAutoApproval: { type: Boolean, default: false },
    siteName: { type: String, default: "VaultStock" },
    supportEmail: { type: String, default: "support@vaultstock.com" },
    allowedRegions: [{ type: String }],
    allowedCountries: [{ type: String }]
}, { timestamps: true });

const AdminSettings = models.AdminSettings || model<IAdminSettings>("AdminSettings", AdminSettingsSchema);
export default AdminSettings;
