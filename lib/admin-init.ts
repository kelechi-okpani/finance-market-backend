import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
    console.log("🔍 Checking for Admin account...");
    try {
        const adminExists = await User.findOne({ role: "admin" });

        if (adminExists) {
            console.log("✅ Admin found:", adminExists.email);
            return;
        }

        console.log("🛠 No admin found. Starting seed process...");

        const email = process.env.INITIAL_ADMIN_EMAIL;
        const password = process.env.INITIAL_ADMIN_PASSWORD;

        if (!email || !password) {
            console.error("❌ ERROR: INITIAL_ADMIN_EMAIL or PASSWORD missing in .env.local");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newAdmin = await User.create({
            firstName: "System",
            lastName: "Admin",
            email: email.toLowerCase(),
            passwordHash: hashedPassword, // Match your schema!
            role: "admin",
            status: "approved",
            accountStatus: "active",
            kycStatus: "verified",
            kycVerified: true,
            onboardingStep: 15,
            totalBalance: 0,
            availableCash: 0,
            // Add any other required fields from your schema here
        });

        console.log("🚀 SUCCESS: Admin account created for:", newAdmin.email);
    } catch (error) {
        console.error("❌ SEED ERROR:", error);
    }
}