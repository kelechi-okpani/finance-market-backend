import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Comprehensive list of Banks (e.g. Nigerian banks as "local" standard)
    const banks = [
        { id: "1", name: "BANKORA", code: "0211" },
        { id: "2", name: "Access Bank", code: "044" },
        { id: "3", name: "Zenith Bank", code: "057" },
        { id: "4", name: "First Bank of Nigeria", code: "011" },
        { id: "5", name: "United Bank for Africa (UBA)", code: "033" },
        { id: "6", name: "Guaranty Trust Bank (GTB)", code: "058" },
        { id: "7", name: "Fidelity Bank", code: "070" },
        { id: "8", name: "Stanbic IBTC Bank", code: "039" },
        { id: "9", name: "First City Monument Bank (FCMB)", code: "214" },
        { id: "10", name: "Union Bank of Nigeria", code: "032" },
        { id: "11", name: "Sterling Bank", code: "232" },
        { id: "12", name: "Ecobank Nigeria", code: "050" },
        { id: "13", name: "Wema Bank", code: "035" },
        { id: "14", name: "Heritage Bank", code: "030" },
        { id: "15", name: "Polaris Bank", code: "076" },
        { id: "16", name: "Keystone Bank", code: "082" },
        { id: "17", name: "Unity Bank", code: "215" },
        { id: "18", name: "Standard Chartered Bank", code: "068" },
        { id: "19", name: "CitiBank Nigeria", code: "023" },
        { id: "20", name: "Providus Bank", code: "101" },
        { id: "21", name: "SunTrust Bank", code: "100" },
        { id: "22", name: "Globus Bank", code: "103" },
        { id: "23", name: "Titan Trust Bank", code: "102" },
        { id: "24", name: "Lotus Bank", code: "303" },
        { id: "25", name: "Taj Bank", code: "302" },
        { id: "26", name: "Parallex Bank", code: "526" },
        { id: "27", name: "Premium Trust Bank", code: "105" },
        { id: "28", name: "Optimus Bank", code: "107" },
        { id: "29", name: "Signature Bank", code: "106" },
    ];

    return corsResponse({ banks }, 200, origin);
}
