import connectDB from "./lib/db";
import Portfolio from "./lib/models/Portfolio";
import User from "./lib/models/User";
import Holding from "./lib/models/Holding";
import TradeRequest from "./lib/models/TradeRequest";
import PortfolioTransfer from "./lib/models/PortfolioTransfer";

async function runFix() {
    try {
        await connectDB();
        console.log("Connected to DB...");

        const email = "julian@private-wealth.io";
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found: " + email);
            process.exit(1);
        }

        console.log(`Fixing user: ${user.email} (${user._id})`);

        // 1. Find all portfolios for this user
        const portfolios = await Portfolio.find({ userId: user._id });
        console.log(`Found ${portfolios.length} portfolios.`);

        if (portfolios.length > 1) {
            // Identify Main Portfolio and Main Growth Portfolio
            const mainP = portfolios.find(p => p.name === "Main Portfolio");
            const mainGrowthP = portfolios.find(p => p.name === "Main Growth Portfolio");

            if (mainP && mainGrowthP) {
                console.log(`Merging ${mainGrowthP.name} into ${mainP.name}`);

                // Move holdings from Main Growth Portfolio to Main Portfolio
                const updateHoldings = await Holding.updateMany(
                    { portfolioId: mainGrowthP._id, userId: user._id },
                    { $set: { portfolioId: mainP._id } }
                );
                console.log(`Moved ${updateHoldings.modifiedCount} holdings.`);

                // Move trade requests
                const updateTrades = await TradeRequest.updateMany(
                    { portfolioId: mainGrowthP._id, userId: user._id },
                    { $set: { portfolioId: mainP._id } }
                );
                console.log(`Moved ${updateTrades.modifiedCount} trade requests.`);

                // Move portfolio transfers
                const updateTransfers = await PortfolioTransfer.updateMany(
                    { portfolioId: mainGrowthP._id },
                    { $set: { portfolioId: mainP._id } }
                );
                console.log(`Moved ${updateTransfers.modifiedCount} portfolio transfers.`);

                // Delete the duplicate portfolio
                await Portfolio.deleteOne({ _id: mainGrowthP._id });
                console.log(`Deleted duplicate portfolio: ${mainGrowthP.name}`);
            }
        }

        console.log("Done fixing specific user.");
        process.exit(0);
    } catch (error) {
        console.error("Error running fix:", error);
        process.exit(1);
    }
}

runFix();
