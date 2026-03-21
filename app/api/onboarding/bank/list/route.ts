import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Comprehensive list of Banks (e.g. Nigerian banks as "local" standard)
    const banks = [
        { id: "1", name: "Access Bank", code: "044" },
        { id: "2", name: "Zenith Bank", code: "057" },
        { id: "3", name: "First Bank of Nigeria", code: "011" },
        { id: "4", name: "United Bank for Africa (UBA)", code: "033" },
        { id: "5", name: "Guaranty Trust Bank (GTB)", code: "058" },
        { id: "6", name: "Fidelity Bank", code: "070" },
        { id: "7", name: "Stanbic IBTC Bank", code: "039" },
        { id: "8", name: "First City Monument Bank (FCMB)", code: "214" },
        { id: "9", name: "Union Bank of Nigeria", code: "032" },
        { id: "10", name: "Sterling Bank", code: "232" },
        { id: "11", name: "Ecobank Nigeria", code: "050" },
        { id: "12", name: "Wema Bank", code: "035" },
        { id: "13", name: "Heritage Bank", code: "030" },
        { id: "14", name: "Polaris Bank", code: "076" },
        { id: "15", name: "Keystone Bank", code: "082" },
        { id: "16", name: "Unity Bank", code: "215" },
        { id: "17", name: "Standard Chartered Bank", code: "068" },
        { id: "18", name: "CitiBank Nigeria", code: "023" },
        { id: "19", name: "Providus Bank", code: "101" },
        { id: "20", name: "SunTrust Bank", code: "100" },
        { id: "21", name: "Globus Bank", code: "103" },
        { id: "22", name: "Titan Trust Bank", code: "102" },
        { id: "23", name: "Lotus Bank", code: "303" },
        { id: "24", name: "Taj Bank", code: "302" },
        { id: "25", name: "Parallex Bank", code: "526" },
        { id: "26", name: "Premium Trust Bank", code: "105" },
        { id: "27", name: "Optimus Bank", code: "107" },
        { id: "28", name: "Signature Bank", code: "106" },
    ];

    return corsResponse({ banks }, 200, origin);
}
