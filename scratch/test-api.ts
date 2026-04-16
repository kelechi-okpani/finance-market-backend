import { getMarketData } from '../lib/stock-utils';

async function test() {
    try {
        const symbols = ["AAPL", "MSFT"];
        console.log("Fetching market data...");
        const data = await getMarketData(symbols);
        console.log("Success! Count:", data.size);
    } catch (err) {
        console.error("Test failed with error:", err);
    }
}

test();
