import { NextRequest } from "next/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET /api/reference/locations
 * Returns location data: { [country]: { [state]: city[] } }
 * Maps to frontend LocationData interface.
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");

    const locations: Record<string, Record<string, string[]>> = {
        "United States": {
            "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
            "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
            "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
            "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"],
            "Illinois": ["Chicago", "Aurora", "Naperville", "Rockford", "Joliet"],
            "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
            "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
            "Georgia": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens"],
            "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
            "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"],
        },
        "United Kingdom": {
            "England": ["London", "Manchester", "Birmingham", "Leeds", "Liverpool"],
            "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"],
            "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry"],
            "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newry", "Bangor"],
        },
        "Nigeria": {
            "Lagos": ["Lagos Island", "Ikeja", "Lekki", "Victoria Island", "Surulere"],
            "Abuja": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
            "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Okrika", "Bonny"],
            "Kano": ["Kano Municipal", "Fagge", "Dala", "Nassarawa", "Tarauni"],
            "Oyo": ["Ibadan North", "Ibadan South", "Ogbomoso", "Oyo", "Iseyin"],
        },
        "Canada": {
            "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London"],
            "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"],
            "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
            "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat"],
        },
        "Germany": {
            "Bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Würzburg"],
            "Berlin": ["Berlin"],
            "Hamburg": ["Hamburg"],
            "Hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach"],
            "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Bonn"],
        },
        "India": {
            "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
            "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangalore", "Belgaum"],
            "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
        },
        "Spain": {
            "Madrid": ["Madrid", "Alcalá de Henares", "Getafe", "Leganés", "Móstoles"],
            "Catalonia": ["Barcelona", "Girona", "Tarragona", "Lleida", "Badalona"],
            "Andalusia": ["Seville", "Málaga", "Córdoba", "Granada", "Cádiz"],
            "Valencia": ["Valencia", "Alicante", "Elche", "Castellón", "Torrevieja"],
        },
        "Australia": {
            "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Coffs Harbour"],
            "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton"],
            "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Cairns", "Townsville"],
            "Western Australia": ["Perth", "Mandurah", "Bunbury", "Geraldton", "Kalgoorlie"],
        },
    };

    return corsResponse({ locations }, 200, origin);
}
