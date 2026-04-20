import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { seedAdmin } from "@/lib/admin-init";

export async function GET(request: NextRequest) {
    try {
        // This forces the DB to connect and run seedAdmin()
        await connectDB(); 
        
        // We call it again here just to be 100% sure it executes in this request cycle
        await seedAdmin(); 

        return NextResponse.json({ message: "Admin check/seed completed successfully." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}