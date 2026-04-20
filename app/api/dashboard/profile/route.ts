import { NextRequest } from "next/server";
import { requireAuth, hashPassword } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";
import SettlementAccount from "@/lib/models/SettlementAccount";
import connectDB from "@/lib/db";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

// GET /api/profile - Full profile info
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const settlementAccounts = await SettlementAccount.find({ userId: auth.user!._id }).sort({ createdAt: -1 });

        return corsResponse({ 
            user: auth.user,
            settlementAccounts 
        }, 200, origin);
    } catch (error) {
        console.error("Profile GET error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}

// PUT /api/profile - Update personal info
export async function PUT(request: NextRequest) {
    const origin = request.headers.get("origin");

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    try {
        const user = auth.user!;
        const body = await request.json();
        const { 
            firstName, lastName, phone, sex, dateOfBirth, 
            occupation, address, country, avatar 
        } = body;

        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (sex) user.sex = sex;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (occupation) user.occupation = occupation.trim();
        if (address) user.address = address.trim();
        if (country) user.country = country.trim();

        // Handle avatar upload if provided
        if (avatar && avatar.startsWith("data:image")) {
            user.avatar = await uploadToCloudinary(avatar, "profiles/avatars");
        } else if (avatar) {
            user.avatar = avatar;
        }

        await user.save();

        return corsResponse({ 
            message: "Profile updated successfully.", 
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                sex: user.sex,
                dateOfBirth: user.dateOfBirth,
                occupation: user.occupation,
                address: user.address,
                country: user.country,
                avatar: user.avatar,
                role: user.role,
                status: user.status,
                kycStatus: user.kycStatus
            }
        }, 200, origin);
    } catch (error) {
        console.error("Profile update error:", error);
        return corsResponse({ error: "Internal server error." }, 500, origin);
    }
}
