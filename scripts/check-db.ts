import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });
const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({ email: String });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function check() {
    await mongoose.connect(MONGODB_URI as string);
    const count = await User.countDocuments();
    console.log(`User Count: ${count}`);
    await mongoose.disconnect();
}
check().catch(console.error);
