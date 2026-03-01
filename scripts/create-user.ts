import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// --- ENV SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

const result = config({ path: envPath });
if (result.error) {
    config({ path: resolve(process.cwd(), ".env.local") });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found. Make sure .env.local exists.");
    process.exit(1);
}

// --- SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["pending", "approved", "rejected", "onboarding"], default: "pending" },
    accountCategory: String,
    investorCode: String,
    kycVerified: { type: Boolean, default: false },
    agreementSigned: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 7 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- MAIN FUNCTION ---
async function createTestUser() {
    const email = process.argv[2];
    const password = process.argv[3];
    const isAdmin = process.argv[4] === "--admin";

    if (!email || !password) {
        console.log("\n❌ Missing arguments!");
        console.log("Usage: npm run create-user <email> <password> [--admin]\n");
        console.log("Example: npm run create-user test@example.com password123");
        process.exit(1);
    }

    console.log(`\n⏳ Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI as string);

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const investorCode = `FS${Math.floor(100000000 + Math.random() * 900000000)}`;

        await User.create({
            email,
            passwordHash,
            firstName: isAdmin ? "Admin" : "Test",
            lastName: isAdmin ? "User" : "Investor",
            role: isAdmin ? "admin" : "user",
            status: "approved", // Automatically approved so you don't have to use API
            accountCategory: "Retail Investor",
            investorCode,
            kycVerified: true,
            agreementSigned: true
        });

        console.log(`\n✅ Success! Created ${isAdmin ? 'ADMIN' : 'APPROVED'} test user:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Investor Code: ${investorCode}`);
        console.log(`\nYou can now log in directly with these credentials! 🚀\n`);
    } catch (err: any) {
        if (err.code === 11000) {
            console.error(`\n❌ Error: The email '${email}' already exists in the database!\n`);
        } else {
            console.error("\n❌ Error creating user:", err.message, "\n");
        }
    }

    await mongoose.disconnect();
}

createTestUser();
