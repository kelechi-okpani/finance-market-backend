import MarketItem from '@/lib/models/financeStock';
import dbConnect from '@/lib/db';



const FINNHUB_KEY = 'd7gsak1r01qmqj46iadgd7gsak1r01qmqj46iae0';

export const SYMBOL_REGISTRY: Record<string, string[]> = {
    indices: ["SPY", "QQQ", "DIA", "IWM"], 
    stocks_us: [
        "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", 
        "AMD", "NFLX", "COIN", "MSTR", "JPM", "V", "WMT", "DIS",
        "PYPL", "BABA", "UBER", "ORCL", "INTC"
    ],
    stocks_ng: ["ZENITHBANK.LG", "GTCO.LG", "DANGCEM.LG", "MTNN.LG", "ACCESSCORP.LG", "UBA.LG"],
    crypto: [
        "BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", 
        "BINANCE:BNBUSDT", "BINANCE:DOGEUSDT", "BINANCE:XRPUSDT",
        "BINANCE:ADAUSDT", "BINANCE:LINKUSDT"
    ],
    forex: [
        "FXP:USD_NGN", "OANDA:EUR_USD", "OANDA:GBP_USD", 
        "OANDA:USD_JPY", "OANDA:AUD_USD"
    ],
};


export async function getMarketData(symbols: string[]) {
    await dbConnect();
    const items = new Map();
    const bulkOps: any = [];

    const requests = symbols.map(async (s) => {
        try {
            const symbol = s.toUpperCase();
            // 1. Fetch Live Price
            const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
            const q = await quoteRes.json();

            // Skip if no price data is returned
            if (!q.c || q.c === 0) return;

            // 2. Check DB for static data (Name, Logo, Active Status)
            let existingRecord = await MarketItem.findOne({ symbol }).lean();
            
            let name = existingRecord?.name;
            let logo = existingRecord?.logo;
            let industry = existingRecord?.industry;
            let marketCap = existingRecord?.marketCap || 0;

            // 3. Only fetch profile from API if missing in DB
            if (!name || !logo || marketCap === 0) {
                const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`);
                const p = await profileRes.json();
                
                name = p.name || symbol;
                logo = p.logo || "";
                industry = p.finnhubIndustry || "Financials";
                marketCap = p.marketCapitalization || 0;
            }

            // Prepare the update object
            const updateFields = {
                symbol,
                name,
                price: q.c,
                change: q.d,
                change_percent: q.dp,
                logo,
                industry,
                marketCap,
                type: name && !symbol.includes(':') ? 'Stock' : (symbol.includes(':') ? 'Crypto' : 'Forex'),
                high: q.h,
                low: q.l,
                open: q.o,
                prev_close: q.pc,
                lastUpdated: new Date()
            };

            bulkOps.push({
                updateOne: {
                    filter: { symbol: symbol },
                    // $set updates the prices, $setOnInsert sets isActive only if it's a new entry
                    update: { 
                        $set: updateFields,
                        $setOnInsert: { isActive: true } 
                    },
                    upsert: true
                }
            });

            items.set(symbol, { ...updateFields, isActive: existingRecord?.isActive ?? true });
        } catch (e) {
            console.error(`Fetch error for ${s}:`, e);
        }
    });

    await Promise.all(requests);

    if (bulkOps.length > 0) {
        await MarketItem.bulkWrite(bulkOps);
    }

    return items;
}

