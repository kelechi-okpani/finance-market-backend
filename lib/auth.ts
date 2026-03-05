import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import connectDB from "./db";
import User, { IUser } from "./models/User";
import { corsResponse } from "./cors";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const TOKEN_EXPIRY = "7d";

// ─── Types ───────────────────────────────────────────────
export interface UserPayload {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
}

// ─── Password helpers ────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── JWT helpers ─────────────────────────────────────────
export function generateToken(user: IUser): string {
    const payload: UserPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

// ─── Extract user from request ───────────────────────────
export async function getAuthUser(
    request: NextRequest
): Promise<IUser | null> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
        return null;
    }

    // Fetch fresh user data from DB
    await connectDB();
    const user = await User.findById(payload.id).select("-passwordHash");

    if (!user) {
        return null;
    }

    return user;
}

// ─── Require auth (logged in only) ─────────────────────────
export async function requireAuth(
    request: NextRequest
): Promise<{ user?: IUser; error?: Response }> {
    const user = await getAuthUser(request);

    if (!user) {
        return {
            error: corsResponse(
                { error: "Unauthorized. Please log in." },
                401,
                request.headers.get("origin")
            ),
        };
    }

    return { user };
}

// ─── Require approved (logged in + verified by admin) ───────
export async function requireApproved(
    request: NextRequest
): Promise<{ user?: IUser; error?: Response }> {
    const { user, error } = await requireAuth(request);
    if (error) return { error };

    if (user!.status !== "approved") {
        return {
            error: corsResponse(
                {
                    error: "Account not approved. Please wait for admin approval.",
                    status: user!.status
                },
                403,
                request.headers.get("origin")
            ),
        };
    }

    return { user };
}

// ─── Require admin middleware ───────────────────────────
export async function requireAdmin(
    request: NextRequest
): Promise<{ user?: IUser; error?: Response }> {
    const { user, error } = await requireAuth(request);
    if (error) return { error };

    if (user!.role !== "admin") {
        return {
            error: corsResponse(
                { error: "Forbidden. Admin access required." },
                403,
                request.headers.get("origin")
            ),
        };
    }

    return { user };
}
