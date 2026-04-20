import mongoose from "mongoose";
import { seedAdmin } from "./admin-init"; // Ensure this path is correct

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable in .env.local"
    );
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

// Initialize the cache from the global object
let cached: MongooseCache = global.mongooseCache ?? {
    conn: null,
    promise: null,
};

if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        // We wrap the connection and the seeding in the same promise
        cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (m) => {
            console.log("✨ MongoDB Connected");
            
            // FIRE AND FORGET: Trigger the admin seed logic
            // We use a try/catch inside seedAdmin so it doesn't break the DB connection if it fails
            seedAdmin().catch(err => console.error("Admin Seeding Error:", err));
            
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null; // Clear the promise on failure so we can retry
        throw e;
    }

    return cached.conn;
}

export default connectDB;



// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//     throw new Error(
//         "Please define the MONGODB_URI environment variable in .env.local"
//     );
// }

// /**
//  * Global is used here to maintain a cached connection across hot reloads
//  * in development. This prevents connections from growing exponentially
//  * during API Route usage.
//  */
// interface MongooseCache {
//     conn: typeof mongoose | null;
//     promise: Promise<typeof mongoose> | null;
// }

// declare global {
//     // eslint-disable-next-line no-var
//     var mongooseCache: MongooseCache | undefined;
// }

// const cached: MongooseCache = global.mongooseCache ?? {
//     conn: null,
//     promise: null,
// };

// if (!global.mongooseCache) {
//     global.mongooseCache = cached;
// }

// async function connectDB(): Promise<typeof mongoose> {
//     if (cached.conn) {
//         return cached.conn;
//     }

//     if (!cached.promise) {
//         const opts = {
//             bufferCommands: false,
//         };

//         cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => m);
//     }

//     try {
//         cached.conn = await cached.promise;
//     } catch (e) {
//         cached.promise = null;
//         throw e;
//     }

//     return cached.conn;
// }

// export default connectDB;
